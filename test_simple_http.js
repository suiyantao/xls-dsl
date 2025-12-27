// 简单测试重构后的HTTP功能

console.log("=== 简单测试重构后的HTTP功能 ===");

// 测试基本的GET请求
console.log("\n1. 测试GET请求:");
try {
    const response = await http.get("https://httpbin.org/get");
    console.log("状态码:", response.status);
    console.log("请求成功!");
} catch (error) {
    console.error("GET请求失败:", error.message);
}

// 测试POST请求
console.log("\n2. 测试POST请求:");
try {
    const postData = { test: "data" };
    const response = await http.post("https://httpbin.org/post", postData);
    console.log("状态码:", response.status);
    console.log("POST请求成功!");
} catch (error) {
    console.error("POST请求失败:", error.message);
}

console.log("\n=== 测试完成 ===");