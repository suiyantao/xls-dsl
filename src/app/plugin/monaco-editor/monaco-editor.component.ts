import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from "@angular/core";
import { invoke } from "@tauri-apps/api/core";
import { debounceTime, fromEvent, throttleTime } from "rxjs";
import { resolveResource } from "@tauri-apps/api/path";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { EditorComponent } from "../editor/editor.component";
import { MessageService } from "../../service/message.service";
import { MqType } from "../../enums/mq-type";
import { FileInfo } from "../../modal/file-info";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-monaco-editor",
  templateUrl: "./monaco-editor.component.html",
  styleUrls: ["./monaco-editor.component.css"],
  standalone: false,
})
export class MonacoEditorComponent implements OnInit, AfterViewInit {
  private static completionProviderRegistered = false;
  private readonly pkgImportTypeCache = new Map<string, Promise<void>>();
  private readonly pkgImportModuleTypes = new Map<
    string,
    {
      name: string;
      version: string;
      moduleSpecifier: string;
      hasDefaultExport: boolean;
    }
  >();
  private readonly pkgImportTypeUris = new Set<string>();
  private pkgImportRegistryDisposable?: { dispose(): void };

  code!: string;

  select_id: number = 0;

  @Input({ required: true }) set id(value: number) {
    this.select_id = value;
    if (value) {
      invoke<FileInfo>("get_by_id", { id: value }).then((file) => {
        this.setVal(file.code as string);
      });
    }
  }

  editorOptions = {
    theme: "vs-light",
    language: "typescript",
    fontSize: 14,
    layout: true,
    locale: "zh-cn",
    quickSuggestions: true,
    parameterHints: { enabled: true },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: "on",
    snippetSuggestions: "top",
    scrollbar: {
      useShadows: true,
      verticalHasArrows: false,
      horizontalHasArrows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
      arrowSize: 10,
    },
  };

  @ViewChild("xtermView") xtermView!: ElementRef;

  @ViewChild("ngxMonacoEditor") ngxMonacoEditor!: EditorComponent;

  @ViewChild("topView") topView!: ElementRef;

  @ViewChild("splitView") splitView!: ElementRef;

  editor: any;

  constructor(public messageSrv: MessageService) {}

  private async loadExtraLibText() {
    const resourcePath = await resolveResource("data/extraLib.d.ts");
    return readTextFile(resourcePath);
  }

  private ensureTypescriptModuleModel(monaco: any) {
    const currentModel = this.editor?.getModel?.();
    const desiredUri = monaco.Uri.parse(
      `file:///xls-dsl-script-${this.select_id || "draft"}.mts`,
    );

    if (currentModel?.uri?.toString() === desiredUri.toString()) {
      monaco.editor.setModelLanguage(currentModel, "typescript");
      return;
    }

    const existingModel = monaco.editor.getModel(desiredUri);
    if (existingModel) {
      existingModel.setValue(currentModel?.getValue?.() ?? this.code ?? "");
      this.editor.setModel(existingModel);
      if (currentModel && currentModel !== existingModel) {
        currentModel.dispose();
      }
      return;
    }

    const moduleModel = monaco.editor.createModel(
      currentModel?.getValue?.() ?? this.code ?? "",
      "typescript",
      desiredUri,
    );
    this.editor.setModel(moduleModel);
    if (currentModel) {
      currentModel.dispose();
    }
  }

  private registerCompletionProvider(monaco: any) {
    if (MonacoEditorComponent.completionProviderRegistered) {
      return;
    }

    monaco.languages.registerCompletionItemProvider("typescript", {
      triggerCharacters: ["."],
      provideCompletionItems: function (
        model: any,
        position: any,
        context: any,
        token: any,
      ) {
        const line = position.lineNumber;
        const content = model.getLineContent(line).trim();
        let word = model.getWordUntilPosition(position);
        let preStr = content.substring(0, word.startColumn - 1);

        const completionItemList = [
          {
            label: "fori",
            insertText: "for(let i=0;i<${1:};i++){\n${2:}\n}",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "fori",
            sortText: "1",
          },
          {
            label: "log",
            insertText: "console.log(${1:});",
            insertTextRules:
              monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: "log",
            sortText: "2",
          },
        ];
        const suggestions = completionItemList.filter((x: any) => {
          return (x.label as string).includes(preStr);
        });

        return {
          suggestions: [...suggestions],
        };
      },
    });

    MonacoEditorComponent.completionProviderRegistered = true;
  }

  private collectPkgImports(code: string) {
    const packageImports = new Map<string, { name: string; version: string }>();
    const pkgImportPattern =
      /pkg\.import\(\s*(["'])([^"']+)\1\s*,\s*(["'])([^"']+)\3\s*\)/g;

    for (const match of code.matchAll(pkgImportPattern)) {
      const name = match[2];
      const version = match[4];
      const packageKey = `${name}@${version}`;
      packageImports.set(packageKey, { name, version });
    }

    return packageImports;
  }

  private pkgImportTypeEntryUrl(name: string, version: string) {
    return `https://esm.sh/${name}@${version}?dts`;
  }

  private pkgImportTypeUri(typeUrl: string) {
    const url = new URL(typeUrl);
    return `ts:pkg-import-types${url.pathname}`;
  }

  private async resolvePkgImportTypeUrl(name: string, version: string) {
    const response = await fetch(this.pkgImportTypeEntryUrl(name, version));
    const typesHeader = response.headers.get("X-TypeScript-Types");
    const entrySource = await response.text();

    if (!typesHeader) {
      throw new Error(
        `esm.sh did not return type definitions for ${name}@${version}`,
      );
    }

    return {
      typeUrl: new URL(typesHeader, response.url).toString(),
      hasDefaultExport:
        entrySource.includes("export { default }") ||
        entrySource.includes("export default"),
    };
  }

  private collectTypeDependencySpecifiers(source: string) {
    const dependencies = new Set<string>();
    const patterns = [
      /from\s+["']([^"']+)["']/g,
      /import\(["']([^"']+)["']\)/g,
      /<reference\s+path=["']([^"']+)["']/g,
      /<reference\s+types=["']([^"']+)["']/g,
    ];

    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern)) {
        dependencies.add(match[1]);
      }
    }

    return [...dependencies];
  }

  private async resolveTypeDependencyUrl(specifier: string, parentUrl: string) {
    if (specifier.startsWith("http://") || specifier.startsWith("https://")) {
      return specifier;
    }

    if (specifier.startsWith(".") || specifier.startsWith("/")) {
      return new URL(specifier, parentUrl).toString();
    }

    return null;
  }

  private async injectPkgTypeTree(
    monaco: any,
    typeUrl: string,
    visited = new Set<string>(),
  ) {
    if (visited.has(typeUrl)) {
      return;
    }
    visited.add(typeUrl);

    const response = await fetch(typeUrl);
    const source = await response.text();
    const virtualUri = this.pkgImportTypeUri(typeUrl);

    if (!this.pkgImportTypeUris.has(virtualUri)) {
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        source,
        virtualUri,
      );
      this.pkgImportTypeUris.add(virtualUri);
    }

    for (const dependency of this.collectTypeDependencySpecifiers(source)) {
      const dependencyUrl = await this.resolveTypeDependencyUrl(
        dependency,
        typeUrl,
      );
      if (dependencyUrl) {
        await this.injectPkgTypeTree(monaco, dependencyUrl, visited);
      }
    }
  }

  private refreshPkgImportTypeRegistry(monaco: any) {
    this.pkgImportRegistryDisposable?.dispose?.();

    const registryEntries = [...this.pkgImportModuleTypes.values()].map(
      ({ name, version, moduleSpecifier, hasDefaultExport }) => {
        const importedType = `typeof import(${JSON.stringify(moduleSpecifier)})`;
        const returnType = hasDefaultExport
          ? `${importedType} & { default: ${importedType} }`
          : importedType;
        return `  ${JSON.stringify(`${name}@${version}`)}: ${returnType};`;
      },
    );

    const declaration = `interface PkgImportTypeRegistry {\n${registryEntries.join("\n")}\n}\n`;
    this.pkgImportRegistryDisposable =
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        declaration,
        "ts:pkg-import-types/pkg-import-registry.d.ts",
      );
  }

  private async ensurePkgImportTypes(monaco: any, code: string) {
    const packageImports = this.collectPkgImports(code);

    for (const [packageKey, { name, version }] of packageImports) {
      if (!this.pkgImportTypeCache.has(packageKey)) {
        const task = this.resolvePkgImportTypeUrl(name, version)
          .then(async ({ typeUrl, hasDefaultExport }) => {
            await this.injectPkgTypeTree(monaco, typeUrl);
            this.pkgImportModuleTypes.set(packageKey, {
              name,
              version,
              moduleSpecifier: this.pkgImportTypeUri(typeUrl),
              hasDefaultExport,
            });
          })
          .catch((error) => {
            console.warn(
              `Failed to load pkg.import types for ${packageKey}`,
              error,
            );
          });
        this.pkgImportTypeCache.set(packageKey, task);
      }
    }

    await Promise.allSettled([...this.pkgImportTypeCache.values()]);
    this.refreshPkgImportTypeRegistry(monaco);
  }

  async onInit(editor: any) {
    this.editor = editor;
    const monaco = (window as any).monaco;
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      allowNonTsExtensions: true,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      target: monaco.languages.typescript.ScriptTarget.ES2022,
    });
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      diagnosticCodesToIgnore: [1375, 1378],
    });
    this.ensureTypescriptModuleModel(monaco);
    monaco.languages.typescript.typescriptDefaults.setModeConfiguration({
      codeActions: true,
      completionItems: true,
      definitions: true,
      diagnostics: true,
      documentHighlights: true,
      documentRangeFormattingEdits: true,
      signatureHelp: true,
      rename: true,
      references: true,
      hover: true,
    });

    this.registerCompletionProvider(monaco);

    try {
      const extraLib = await this.loadExtraLibText();
      monaco.languages.typescript.typescriptDefaults.addExtraLib(
        extraLib,
        "ts:extraLib/extraLib.d.ts",
      );
      await this.ensurePkgImportTypes(
        monaco,
        this.code ?? this.editor?.getValue?.() ?? "",
      );
    } catch (error) {
      console.warn("Failed to load Monaco extra lib", error);
    }
  }

  ngAfterViewInit(): void {
    const editor = this.ngxMonacoEditor._editorContainer.nativeElement;
    editor.style.height = this.topView.nativeElement.clientHeight + "px";

    const themeMedia = window.matchMedia("(prefers-color-scheme: light)");
    if (themeMedia.matches) {
      this.ngxMonacoEditor.options = {
        ...this.editorOptions,
        theme: "vs-light",
      };
    } else {
      this.ngxMonacoEditor.options = {
        ...this.editorOptions,
        theme: "vs-dark",
      };
    }
    themeMedia.addEventListener("change", (e) => {
      if (e.matches) {
        this.ngxMonacoEditor.options = {
          ...this.editorOptions,
          theme: "vs-light",
        };
      } else {
        this.ngxMonacoEditor.options = {
          ...this.editorOptions,
          theme: "vs-dark",
        };
      }
    });
    this.messageSrv.onMessage((message) => {
      if (message.type === MqType.SPLIT) {
        this.fitEditor();
      }
    });

    fromEvent(window, "resize")
      .pipe(debounceTime(100))
      .subscribe(() => {
        this.fitEditor();
      });
  }

  public fitEditor() {
    const editor = this.ngxMonacoEditor._editorContainer.nativeElement;
    editor.style.height = this.topView.nativeElement.clientHeight + "px";
    this.editor.layout();
  }

  ngOnInit(): void {}

  private setVal(val: string): void {
    if (!this.ngxMonacoEditor) {
      return;
    }
    // 将值设置给Monaco Editor
    this.ngxMonacoEditor.writeValue(val);
    // 滚动到顶部
    this.ngxMonacoEditor.setScrollTop(0);
  }

  codeChange(value: string) {
    const params = { id: this.select_id, code: value };
    void this.ensurePkgImportTypes((window as any).monaco, value);
    invoke("update_code_by_id", { ...params }).then((_) => {});
  }
}
