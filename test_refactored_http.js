// 测试重构后的HTTP功能

console.log("=== 测试重构后的HTTP功能 ===");

// 测试1: 基本的GET请求（无headers）
console.log("\n1. 测试GET请求（无headers）:");
try {
    const response1 = await http.get("https://httpbin.org/get");
    console.log("状态码:", response1.status);
    console.log("响应体:", JSON.stringify(response1.body, null, 2));
} catch (error) {
    console.error("GET请求失败:", error.message);
}

// 测试2: GET请求带headers
console.log("\n2. 测试GET请求（带headers）:");
try {
    const response2 = await http.get("https://httpbin.org/get", {
        "User-Agent": "XLS-DSL-Test",
        "X-Custom-Header": "test-value"
    });
    console.log("状态码:", response2.status);
    console.log("响应体:", JSON.stringify(response2.body, null, 2));
} catch (error) {
    console.error("GET请求失败:", error.message);
}

// 测试3: POST请求
console.log("\n3. 测试POST请求:");
try {
    const postData = {
        name: "John Doe",
        age: 30,
        active: true
    };
    const response3 = await http.post("https://httpbin.org/post", postData);
    console.log("状态码:", response3.status);
    console.log("响应体:", JSON.stringify(response3.body, null, 2));
} catch (error) {
    console.error("POST请求失败:", error.message);
}

// 测试4: 表单提交
console.log("\n4. 测试表单提交:");
try {
    const formData = {
        username: "testuser",
        password: "testpass",
        remember: "on"
    };
    const response4 = await http.postForm("https://httpbin.org/post", formData);
    console.log("状态码:", response4.status);
    console.log("响应体:", JSON.stringify(response4.body, null, 2));
} catch (error) {
    console.error("表单提交失败:", error.message);
}

// 测试5: PUT请求
console.log("\n5. 测试PUT请求:");
try {
    const putData = {
        id: 123,
        name: "Updated Name",
        status: "active"
    };
    const response5 = await http.put("https://httpbin.org/put", putData);
    console.log("状态码:", response5.status);
    console.log("响应体:", JSON.stringify(response5.body, null, 2));
} catch (error) {
    console.error("PUT请求失败:", error.message);
}

// 测试6: DELETE请求
console.log("\n6. 测试DELETE请求:");
try {
    const response6 = await http.delete("https://httpbin.org/delete");
    console.log("状态码:", response6.status);
    console.log("响应体:", JSON.stringify(response6.body, null, 2));
} catch (error) {
    console.error("DELETE请求失败:", error.message);
}

// 测试7: Cookie管理
console.log("\n7. 测试Cookie管理:");
try {
    // 设置cookie
    await http.setCookie("test-cookie", "test-value", "httpbin.org", "/", new Date(Date.now() + 3600000), false, false);
    console.log("Cookie设置成功");
    
    // 获取cookies
    const cookies = await http.getCookies();
    console.log("当前cookies:", cookies);
    
    // 清除cookies
    await http.clearCookies();
    console.log("Cookies已清除");
} catch (error) {
    console.error("Cookie管理失败:", error.message);
}

console.log("\n=== 所有测试完成 ===");