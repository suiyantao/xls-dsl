import { MonacoEditorComponent } from './monaco-editor.component';

describe('MonacoEditorComponent', () => {
  let component: MonacoEditorComponent;
  let monacoMock: any;

  beforeEach(() => {
    monacoMock = {
      languages: {
        CompletionItemInsertTextRule: {
          InsertAsSnippet: 4,
        },
        registerCompletionItemProvider: jasmine
          .createSpy('registerCompletionItemProvider'),
        typescript: {
          javascriptDefaults: {
            setModeConfiguration: jasmine.createSpy('setModeConfiguration'),
            addExtraLib: jasmine.createSpy('addExtraLib'),
          },
        },
      },
    };

    (window as any).monaco = monacoMock;
    component = new MonacoEditorComponent({ onMessage: () => {} } as any);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps completion registration when extra lib loading fails', async () => {
    spyOn<any>(component, 'loadExtraLibText').and.returnValue(
      Promise.reject(new Error('load failed')),
    );

    await expectAsync(component.onInit({})).toBeResolved();

    expect(
      monacoMock.languages.typescript.javascriptDefaults.setModeConfiguration,
    ).toHaveBeenCalled();
    expect(monacoMock.languages.registerCompletionItemProvider).toHaveBeenCalledWith(
      'javascript',
      jasmine.any(Object),
    );
  });
});
