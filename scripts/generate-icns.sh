#!/bin/bash

# macOS icns 图标生成脚本
# 将 PNG 图片转换为 macOS 应用图标 (.icns 格式)

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数：显示帮助信息
show_help() {
    echo -e "${BLUE}macOS icns 图标生成器${NC}"
    echo ""
    echo "用法: $0 [选项] <输入PNG文件>"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示帮助信息"
    echo "  -o, --output <文件>  输出 icns 文件路径 (默认: 输入文件名.icns)"
    echo "  -n, --name <名称>    图标名称 (默认: 输入文件名)"
    echo "  -v, --verbose       显示详细输出"
    echo "  -c, --clean         清理临时文件"
    echo ""
    echo "示例:"
    echo "  $0 icon.png"
    echo "  $0 -o MyApp.icns icon.png"
    echo "  $0 --name MyApp --output icons/MyApp.icns input.png"
}

# 函数：检查依赖
check_dependencies() {
    local missing_deps=()
    
    if ! command -v sips &> /dev/null; then
        missing_deps+=("sips")
    fi
    
    if ! command -v iconutil &> /dev/null; then
        missing_deps+=("iconutil")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo -e "${RED}错误: 缺少以下依赖工具:${NC}"
        for dep in "${missing_deps[@]}"; do
            echo -e "  - $dep"
        done
        echo ""
        echo "这些工具是 macOS 系统自带的，请确保您在 macOS 系统上运行此脚本。"
        exit 1
    fi
}

# 函数：验证输入文件
validate_input() {
    local input_file="$1"
    
    if [ ! -f "$input_file" ]; then
        echo -e "${RED}错误: 输入文件 '$input_file' 不存在${NC}"
        exit 1
    fi
    
    # 检查文件扩展名
    if [[ ! "$input_file" =~ \.png$ ]]; then
        echo -e "${YELLOW}警告: 建议输入 PNG 格式的图片以获得最佳效果${NC}"
    fi
    
    # 检查图片尺寸
    local width height
    width=$(sips -g pixelWidth "$input_file" | awk '/pixelWidth/ {print $2}')
    height=$(sips -g pixelHeight "$input_file" | awk '/pixelHeight/ {print $2}')
    
    if [ "$width" -lt 1024 ] || [ "$height" -lt 1024 ]; then
        echo -e "${YELLOW}警告: 建议输入至少 1024x1024 像素的图片以获得最佳效果${NC}"
        echo "当前尺寸: ${width}x${height}"
    fi
}

# 函数：生成图标集
generate_iconset() {
    local input_file="$1"
    local icon_name="$2"
    local output_icns="$3"
    local verbose="$4"
    
    # 创建临时目录
    local temp_dir
    temp_dir=$(mktemp -d)
    local iconset_dir="${temp_dir}/${icon_name}.iconset"
    
    mkdir -p "$iconset_dir"
    
    # 定义所需尺寸
    local sizes=(16 32 64 128 256 512 1024)
    local scale_factors=(1 2)
    
    echo -e "${BLUE}正在生成图标集...${NC}"
    
    for size in "${sizes[@]}"; do
        for scale in "${scale_factors[@]}"; do
            local actual_size=$((size * scale))
            local icon_name="icon_${size}x${size}"
            
            if [ "$scale" -eq 2 ]; then
                icon_name="${icon_name}@2x"
            fi
            
            local output_file="${iconset_dir}/${icon_name}.png"
            
            if [ "$verbose" = true ]; then
                echo -e "  生成 ${actual_size}x${actual_size} (${icon_name}.png)"
            fi
            
            # 使用 sips 调整图片尺寸
            sips -z "$actual_size" "$actual_size" "$input_file" --out "$output_file" &> /dev/null
            
            # 验证生成结果
            if [ ! -f "$output_file" ]; then
                echo -e "${RED}错误: 生成 ${icon_name}.png 失败${NC}"
                rm -rf "$temp_dir"
                exit 1
            fi
        done
    done
    
    echo -e "${GREEN}✓ 图标集生成完成${NC}"
    
    # 使用 iconutil 生成 icns 文件
    echo -e "${BLUE}正在生成 icns 文件...${NC}"
    iconutil -c icns "$iconset_dir" -o "$output_icns"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ icns 文件生成成功: $output_icns${NC}"
    else
        echo -e "${RED}错误: icns 文件生成失败${NC}"
        rm -rf "$temp_dir"
        exit 1
    fi
    
    # 清理临时文件
    rm -rf "$temp_dir"
}

# 函数：显示文件信息
show_file_info() {
    local file="$1"
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}文件信息:${NC}"
        ls -lh "$file"
        echo ""
        echo -e "${GREEN}图标预览:${NC}"
        # 使用 sips 显示图标信息
        sips -g all "$file" 2>/dev/null | head -20
    fi
}

# 主函数
main() {
    local input_file=""
    local output_icns=""
    local icon_name=""
    local verbose=false
    local clean=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -o|--output)
                output_icns="$2"
                shift 2
                ;;
            -n|--name)
                icon_name="$2"
                shift 2
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            -c|--clean)
                clean=true
                shift
                ;;
            -*)
                echo -e "${RED}错误: 未知选项 $1${NC}"
                show_help
                exit 1
                ;;
            *)
                input_file="$1"
                shift
                ;;
        esac
    done
    
    # 检查必需参数
    if [ -z "$input_file" ]; then
        echo -e "${RED}错误: 必须指定输入文件${NC}"
        show_help
        exit 1
    fi
    
    # 检查依赖
    check_dependencies
    
    # 验证输入文件
    validate_input "$input_file"
    
    # 设置默认值
    if [ -z "$icon_name" ]; then
        icon_name=$(basename "$input_file" | sed 's/\.[^.]*$//')
    fi
    
    if [ -z "$output_icns" ]; then
        output_icns="${icon_name}.icns"
    fi
    
    # 显示配置信息
    echo -e "${BLUE}=== icns 图标生成器 ===${NC}"
    echo -e "输入文件: ${GREEN}$input_file${NC}"
    echo -e "输出文件: ${GREEN}$output_icns${NC}"
    echo -e "图标名称: ${GREEN}$icon_name${NC}"
    echo ""
    
    # 生成图标
    generate_iconset "$input_file" "$icon_name" "$output_icns" "$verbose"
    
    # 显示结果信息
    show_file_info "$output_icns"
    
    echo -e "${GREEN}🎉 图标生成完成！${NC}"
    echo -e "您现在可以在 Xcode 项目中使用 ${GREEN}$output_icns${NC} 作为应用图标了。"
}

# 如果直接运行脚本（不是被 source）
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi