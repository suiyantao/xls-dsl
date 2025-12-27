// 测试新的表单提交功能
async function testFormPost() {
    try {
        console.log("测试表单提交功能...");
        
        // 测试1: 基本表单数据提交
        console.log("\n1. 测试基本表单数据提交:");
        const formData = {
            "username": "testuser",
            "password": "testpass123",
            "remember": "true"
        };
        
        const response1 = await op_http_post_form(
            "https://httpbin.org/post",
            null, // 无URL参数
            formData,
            null  // 无自定义头部
        );
        
        console.log("状态码:", response1.status);
        console.log("响应时间:", response1.duration_ms, "ms");
        console.log("响应数据:", JSON.stringify(response1.body, null, 2));
        
        // 测试2: 带URL参数的表单提交
        console.log("\n2. 测试带URL参数的表单提交:");
        const urlParams = {
            "source": "test",
            "version": "1.0"
        };
        
        const formData2 = {
            "action": "login",
            "timestamp": new Date().toISOString()
        };
        
        const response2 = await op_http_post_form(
            "https://httpbin.org/post",
            urlParams,
            formData2,
            null
        );
        
        console.log("状态码:", response2.status);
        console.log("响应时间:", response2.duration_ms, "ms");
        console.log("响应数据:", JSON.stringify(response2.body, null, 2));
        
        // 测试3: 带自定义头部的表单提交
        console.log("\n3. 测试带自定义头部的表单提交:");
        const headers = {
            headers: {
                "X-Custom-Header": "test-value",
                "User-Agent": "XLS-DSL-Test/1.0"
            }
        };
        
        const formData3 = {
            "test": "value",
            "number": "42"
        };
        
        const response3 = await op_http_post_form(
            "https://httpbin.org/post",
            null,
            formData3,
            headers
        );
        
        console.log("状态码:", response3.status);
        console.log("响应时间:", response3.duration_ms, "ms");
        console.log("响应数据:", JSON.stringify(response3.body, null, 2));
        
        console.log("\n✅ 所有表单提交测试完成！");
        
    } catch (error) {
        console.error("❌ 测试失败:", error);
    }
}

// 运行测试
testFormPost();