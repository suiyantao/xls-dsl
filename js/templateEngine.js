/**
 * 模板引擎函数，用于将模板字符串根据给定的数据进行渲染。
 * @param {string} template - 包含模板语法的字符串。
 * @param {Object} data - 用于填充模板的数据对象。
 * @returns {string} - 渲染后的字符串。
 */
function templateEngine(template, data) {
    // 处理注释，移除模板中所有 {{!-- ... --}} 格式的注释
    template = template.replace(/{{!--(.*?)--}}/gs, '');

    // 定义过滤器函数，用于对模板中的变量进行额外处理
    const filters = {
        /**
         * 将字符串的首字母转换为大写。
         * @param {string} str - 输入的字符串。
         * @returns {string} - 首字母大写后的字符串。
         */
        cap_first: (str) => {
            // 如果输入不是字符串，则直接返回原输入
            if (typeof str !== 'string') return str;
            return str.charAt(0).toUpperCase() + str.slice(1);
        },
        /**
         * 将字符串的首字母转换为小写。
         * @param {string} str - 输入的字符串。
         * @returns {string} - 首字母小写后的字符串。
         */
        uncap_first: (str) => {
            // 如果输入不是字符串，则直接返回原输入
            if (typeof str !== 'string') return str;
            return str.charAt(0).toLowerCase() + str.slice(1);
        },
        /**
         * 将字符串转换为大写。
         * @param {string} str - 输入的字符串。
         * @returns {string} - 大写后的字符串。
         */
        cap: (str) => {
            // 如果输入不是字符串，则直接返回原输入
            if (typeof str !== 'string') return str;
            return str.toUpperCase();
        },
        /**
         * 将字符串转换为小写。
         * @param {string} str - 输入的字符串。
         * @returns {string} - 小写后的字符串。
         */
        uncap: (str) => {
            // 如果输入不是字符串，则直接返回原输入
            if (typeof str !== 'string') return str;
            return str.toLowerCase();
        },
        /**
         * 将驼峰命名法的字符串转换为下划线命名法。
         * @param {string} str - 输入的驼峰命名法字符串。
         * @returns {string} - 转换后的下划线命名法字符串。
         */
        camel_to_snake: (str) => {
            // 如果输入不是字符串，则直接返回原输入
            if (typeof str !== 'string') return str;
            // 将大写字母替换为 _ 加上小写字母，并移除开头的 _
            return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
        },
        /**
         * 将下划线命名法的字符串转换为驼峰命名法。
         * @param {string} str - 输入的下划线命名法字符串。
         * @returns {string} - 转换后的驼峰命名法字符串。
         */
        snake_to_camel: (str) => {
            // 如果输入不是字符串，则直接返回原输入
            if (typeof str !== 'string') return str;
            // 将 _ 加上小写字母替换为大写字母
            return str.replace(/_([a-z])/g, (match, group) => group.toUpperCase());
        },
        /**
         * 将日期对象或时间戳格式化为指定格式的字符串。
         * @param {Date|number} date - 输入的日期对象或时间戳。
         * @param {string} format - 日期格式字符串，支持的格式：YYYY（年）、MM（月）、DD（日）、HH（时）、mm（分）、ss（秒）。
         * @returns {string} - 格式化后的日期字符串。
         */
        date_format: (date, format) => {
            if (!(date instanceof Date) && typeof date !== 'number') return date;
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hour = String(d.getHours()).padStart(2, '0');
            const minute = String(d.getMinutes()).padStart(2, '0');
            const second = String(d.getSeconds()).padStart(2, '0');

            return format
                .replace('YYYY', year)
                .replace('MM', month)
                .replace('DD', day)
                .replace('HH', hour)
                .replace('mm', minute)
                .replace('ss', second);
        }
    };

    // 定义处理条件判断和循环的正则表达式
    // 匹配 {{#if ...}} ... {{/if}} 格式的条件判断语句
    const ifRegex = /{{#if\s+([^}]+)}}(.*?){{\/if}}/gs;
    // 匹配 {{#each ...}} ... {{/each}} 格式的循环语句
    const eachRegex = /{{#each\s+([^}]+)}}(.*?){{\/each}}/gs;
    // 匹配 {{ ... }} 格式的变量占位符
    const variableRegex = /{{\s*([^}]+)\s*}}/g;

    /**
     * 递归处理模板中的嵌套结构，包括条件判断、循环和变量替换。
     * @param {string} content - 当前需要处理的模板内容。
     * @param {Object} data - 用于填充模板的数据对象。
     * @returns {string} - 处理后的内容。
     */
    function processNested(content, data) {
        // 处理条件判断语句
        content = content.replace(ifRegex, (match, condition, innerContent) => {
            // 创建一个新的函数来执行条件判断
            const fn = new Function('data', `with(data) { return ${condition} }`);
            // 如果条件为真，则递归处理内部内容；否则返回空字符串
            return fn(data) ? processNested(innerContent, data) : '';
        });

        // 处理循环语句
        content = content.replace(eachRegex, (match, arrayName, innerContent) => {
            // 创建一个新的函数来获取数组数据
            const array = new Function('data', `with(data) { return ${arrayName} }`)(data);
            let output = '';
            // 如果获取到的是数组，则遍历数组并递归处理内部内容
            if (Array.isArray(array)) {
                array.forEach(item => {
                    const newContent = processNested(innerContent, item);
                    output += newContent;
                });
            }
            return output;
        });

        // 处理变量替换
        content = content.replace(variableRegex, (match, variable) => {
            let valueExpression = variable;
            let filterChain = [];

            // 分离表达式和过滤器链
            const parts = variable.split('|');
            valueExpression = parts[0].trim();
            filterChain = parts.slice(1).map(part => {
                // 分离过滤器名称和参数，这里修改为匹配单引号内的内容
                const match = part.match(/(\w+)\s*('.*?'|".*?"|\S+)/);
                if (match) {
                    const filterName = match[1].trim();
                    let arg = match[2].trim();
                    // 移除引号
                    if ((arg.startsWith("'") && arg.endsWith("'")) || (arg.startsWith('"') && arg.endsWith('"'))) {
                        arg = arg.slice(1, -1);
                    }
                    return { name: filterName, args: [arg] };
                }
                return null;
            }).filter(filter => filter);

            try {
                const fn = new Function('data', `with(data) { return ${valueExpression} }`);
                let result = fn(data);

                // 应用过滤器链
                filterChain.forEach(({ name, args }) => {
                    if (filters[name]) {
                        // 将结果作为第一个参数，后面跟上过滤器的参数
                        result = filters[name](result, ...args);
                    }
                });

                return typeof result === 'function' ? result.call(data) : result || '';
            } catch (e) {
                console.error(`执行表达式 "${valueExpression}" 时出错:`, e);
                return '';
            }
        });

        return content;
    }

    // 调用 processNested 函数处理整个模板
    let rendered = processNested(template, data);
    // 清理多余的空行
    rendered = rendered.replace(/^\s*[\r\n]/gm, '');
    // 返回处理后的结果并去除首尾空格
    return rendered.trim();
}

// 使用示例
const template = `
{{!-- 这是一个注释，不会出现在最终结果中 --}}
<h1>{{ title }}</h1>
{{#if showList}}
<ul>
{{#each items}}
    <li>{{ name | uncap_first }} - {{ price > 5 ? '价格较高' : '价格合理' }}</li>
    <li>{{ camelCaseName | camel_to_snake }}</li>
    <li>{{ snake_case_name | snake_to_camel }}</li>
    <li>{{ date | date_format 'YYYY-MM-DD HH:mm:ss' }}</li>
{{/each}}
</ul>
{{/if}}
`;

// 示例数据
const data = {
    title: '商品列表',
    showList: true,
    items: [
        { 
            name: 'Ceshi', 
            price: 6,
            camelCaseName: 'exampleCamelCase',
            snake_case_name: 'example_snake_case',
            date: new Date()
        },
        { 
            name: '香蕉', 
            price: 3,
            camelCaseName: 'anotherCamelCase',
            snake_case_name: 'another_snake_case',
            date: new Date()
        }
    ]
};

// 调用模板引擎函数进行渲染
const rendered = templateEngine(template, data);
// 输出渲染后的结果
console.log(rendered);