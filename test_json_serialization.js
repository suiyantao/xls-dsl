// 测试JSON序列化功能

console.log("=== 测试JSON序列化功能 ===");

// 测试不同类型的JSON值
console.log("\n1. 测试字符串:");
println("Hello World");

console.log("\n2. 测试数字:");
println(42);

console.log("\n3. 测试布尔值:");
println(true);
println(false);

console.log("\n4. 测试null:");
println(null);

console.log("\n5. 测试对象:");
const obj = {
    name: "John Doe",
    age: 30,
    active: true,
    address: {
        street: "123 Main St",
        city: "New York"
    }
};
println(obj);

console.log("\n6. 测试数组:");
const arr = [1, 2, 3, "four", true, { key: "value" }];
println(arr);

console.log("\n7. 测试复杂嵌套结构:");
const complex = {
    users: [
        { id: 1, name: "Alice", roles: ["admin", "user"] },
        { id: 2, name: "Bob", roles: ["user"] }
    ],
    settings: {
        theme: "dark",
        notifications: {
            email: true,
            push: false
        }
    },
    metadata: {
        version: "1.0.0",
        timestamp: new Date().toISOString()
    }
};
println(complex);

console.log("\n=== JSON序列化测试完成 ===");