// 测试Cookie共享功能

console.log("=== 测试Cookie共享功能 ===");

// 1. 测试获取初始cookies
console.log("\n1. 获取初始cookies:");
try {
    const cookies = await op_http_get_cookies();
    console.log("初始cookies:", JSON.stringify(cookies, null, 2));
} catch (error) {
    console.error("获取cookies失败:", error);
}

// 2. 测试设置cookie
console.log("\n2. 设置测试cookie:");
try {
    const result = await op_http_set_cookie(
        "test_cookie", 
        "test_value", 
        "example.com", 
        "/", 
        null, 
        false, 
        false
    );
    console.log("设置cookie结果:", result);
} catch (error) {
    console.error("设置cookie失败:", error);
}

// 3. 测试HTTP请求并观察cookies
console.log("\n3. 发送HTTP请求测试cookie共享:");
try {
    // 首先访问一个会设置cookie的网站
    const response1 = await op_http_get("https://httpbin.org/cookies/set?test=value", null);
    console.log("设置cookie响应状态:", response1.status);
    
    // 然后访问需要cookie的页面
    const response2 = await op_http_get("https://httpbin.org/cookies", null);
    console.log("获取cookies响应状态:", response2.status);
    console.log("获取cookies响应体:", response2.body);
    
} catch (error) {
    console.error("HTTP请求失败:", error);
}

// 4. 测试清除cookies
console.log("\n4. 清除所有cookies:");
try {
    const clearResult = await op_http_clear_cookies();
    console.log("清除cookies结果:", clearResult);
    
    // 再次获取cookies
    const cookiesAfterClear = await op_http_get_cookies();
    console.log("清除后的cookies:", JSON.stringify(cookiesAfterClear, null, 2));
} catch (error) {
    console.error("清除cookies失败:", error);
}

console.log("\n=== Cookie共享功能测试完成 ===");