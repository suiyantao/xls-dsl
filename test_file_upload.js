// 文件上传测试脚本
async function testFileUpload() {
    try {
        console.log("测试文件上传功能...");
        
        // 测试1: 单文件上传
        console.log("\n1. 测试单文件上传:");
        const singleFile = [{
            field_name: "file",
            file_path: "/Users/suiyantao/Documents/GitHub/xls-dsl/test_upload.txt",
            file_name: "test_upload.txt",
            mime_type: "text/plain"
        }];
        
        const response1 = await op_http_post_upload(
            "https://httpbin.org/post",
            null, // 无URL参数
            null, // 无附加字段
            singleFile,
            null  // 无自定义头部
        );
        
        console.log("状态码:", response1.status);
        console.log("响应时间:", response1.duration_ms, "ms");
        console.log("响应数据:", JSON.stringify(response1.body, null, 2));
        
        // 测试2: 多文件上传 + 表单字段
        console.log("\n2. 测试多文件上传 + 表单字段:");
        const multipleFiles = [
            {
                field_name: "document",
                file_path: "/Users/suiyantao/Documents/GitHub/xls-dsl/test_doc.txt",
                file_name: "document.txt",
                mime_type: "text/plain"
            },
            {
                field_name: "image",
                file_path: "/Users/suiyantao/Documents/GitHub/xls-dsl/test_image.png",
                file_name: "screenshot.png",
                mime_type: "image/png"
            }
        ];
        
        const formFields = {
            "user_id": "12345",
            "category": "documents",
            "description": "测试文件上传"
        };
        
        const response2 = await op_http_post_upload(
            "https://httpbin.org/post",
            null, // 无URL参数
            formFields,
            multipleFiles,
            null  // 无自定义头部
        );
        
        console.log("状态码:", response2.status);
        console.log("响应时间:", response2.duration_ms, "ms");
        console.log("响应数据:", JSON.stringify(response2.body, null, 2));
        
        // 测试3: 带URL参数和自定义头部
        console.log("\n3. 测试带URL参数和自定义头部:");
        const urlParams = {
            "source": "app",
            "version": "1.0",
            "token": "abc123"
        };
        
        const customHeaders = {
            headers: {
                "X-Custom-Header": "file-upload-test",
                "Authorization": "Bearer test-token-123"
            }
        };
        
        const uploadFile = [{
            field_name: "upload",
            file_path: "/Users/suiyantao/Documents/GitHub/xls-dsl/config.json",
            file_name: "config.json",
            mime_type: "application/json"
        }];
        
        const additionalFields = {
            "upload_type": "configuration",
            "environment": "testing"
        };
        
        const response3 = await op_http_post_upload(
            "https://httpbin.org/post",
            urlParams,
            additionalFields,
            uploadFile,
            customHeaders
        );
        
        console.log("状态码:", response3.status);
        console.log("响应时间:", response3.duration_ms, "ms");
        console.log("响应数据:", JSON.stringify(response3.body, null, 2));
        
        // 测试4: 错误处理测试（文件不存在）
        console.log("\n4. 测试错误处理（文件不存在）:");
        try {
            const nonExistentFile = [{
                field_name: "file",
                file_path: "/Users/suiyantao/Documents/GitHub/xls-dsl/non_existent_file.txt",
                file_name: "missing.txt",
                mime_type: "text/plain"
            }];
            
            await op_http_post_upload(
                "https://httpbin.org/post",
                null,
                null,
                nonExistentFile,
                null
            );
        } catch (error) {
            console.log("✅ 正确捕获错误:", error.message);
        }
        
        console.log("\n✅ 所有文件上传测试完成！");
        
    } catch (error) {
        console.error("❌ 测试失败:", error);
    }
}

// 运行测试前，先创建测试文件
function createTestFiles() {
    try {
        // 创建测试文本文件
        const fs = require('fs');
        
        // 创建简单的文本文件
        fs.writeFileSync('/Users/suiyantao/Documents/GitHub/xls-dsl/test_upload.txt', '这是一个文件上传测试文件。\n测试内容：Hello World!\n时间: ' + new Date().toISOString());
        
        // 创建文档文件
        fs.writeFileSync('/Users/suiyantao/Documents/GitHub/xls-dsl/test_doc.txt', '文档内容测试\n这是第二行\n第三行内容');
        
        // 创建JSON配置文件
        const config = {
            app: "xls-dsl",
            version: "1.0.0",
            settings: {
                theme: "dark",
                language: "zh-CN"
            },
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync('/Users/suiyantao/Documents/GitHub/xls-dsl/config.json', JSON.stringify(config, null, 2));
        
        console.log("✅ 测试文件创建完成！");
        
    } catch (error) {
        console.log("⚠️  创建测试文件时出错（可能权限问题）:", error.message);
        console.log("请手动创建测试文件或使用现有文件进行测试。");
    }
}

// 先创建测试文件，然后运行上传测试
createTestFiles();
setTimeout(() => {
    testFileUpload();
}, 1000);