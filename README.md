# zxc123-sude · AWB & Imaging

面向相机 ISP / 自动白平衡（AWB）的个人作品集，使用原生 HTML、CSS 和 JavaScript，无构建步骤、无外部字体、无第三方运行时依赖。

## 内容

- 个人方向与已具备的 Python / C++ / ISP 基础。
- 首个项目 AWB-Lab 的初版范围、算法假设与后续计划。
- 浏览器本地 AWB 演示：Gray World、Max RGB、Shades of Gray（p = 6）。
- 可切换暖光 / 冷光 / 偏绿色光的合成场景与前后对比滑块。
- JPG / PNG / WebP 本地图片输入、RGB 增益显示、恢复合成场景。

页面不宣称尚未完成的学历、工作经历、实验结果、Star 数量或 C++ 性能成绩。[AWB-Lab 源码与评测协议](https://github.com/zxc123-sude/awb-lab)包含四种经典算法：Gray World、Max RGB、Shades of Gray 和 Gray Edge；浏览器仅演示前三种统计方法。

## 本地查看

直接打开 `index.html`，或用任意静态 HTTP 服务预览。无需安装依赖。

```powershell
python -m http.server 8000
```

在浏览器访问 `http://localhost:8000`。

## 演示算法与限制

对浏览器解码后的 sRGB 像素，先执行 sRGB 反向传递函数，在线性 RGB 中估计各通道统计量 `e`：

- **Gray World**：通道均值。
- **Max RGB**：通道最大值。
- **Shades of Gray**：`(mean(I^p))^(1/p)`，本演示取 `p = 6`。

浏览器默认排除任意通道达到 255 的饱和像素，以及三个通道均小于 5（8 位 sRGB）的近黑像素，并显示有效像素数量。这是一套演示用筛选规则；Python 仓库的 RAW/线性数据规则以其评测协议为准。没有有效像素或任意通道统计量低于数值阈值时，明确显示“有效颜色信息不足，无法估计”，保留原图且不报告伪造的增益。

有效时，以绿色为基准计算增益 `[e_g / e_r, 1, e_g / e_b]`，随后在线性空间施加增益，裁剪至 `[0, 1]`，编码回 sRGB。合成色偏也在线性空间施加，预设为暖光 `[1.42, 1, 0.65]`、冷光 `[0.73, 1, 1.35]`、偏绿色 `[0.83, 1.21, 0.89]`。

合成场景由 Canvas 绘制，**不是相机数据集，不是实测 benchmark**。演示没有真实光源标注、误差成绩或对比排名。屏幕图像线性化不能替代 RAW 黑电平处理、传感器校准或色彩管理。全局增益无法解决混合光源，简单筛选也无法解决场景统计偏差；这是学习经典假设的工具。

上传图片仅在浏览器内处理，不发起网络请求；最大文件 25 MB，解码后长边缩至不超过 1280 像素，透明像素合成在白色背景。对象 URL 在处理后释放。浏览器仍需首先解码原图，因此建议使用普通尺寸图片。

## GitHub Pages 部署

1. 将本目录推送到账号 `zxc123-sude` 的公开仓库 `zxc123-sude.github.io`。
2. 在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **Deploy from a branch**，分支选择 **main**，目录选择 **/ (root)** 后保存。
3. 更新 `main` 后，GitHub 自动运行 Pages 构建和部署。
4. 网站地址为 `https://zxc123-sude.github.io/`；应以 Pages 设置和实际部署状态为准。

若实际默认分支不为 `main`，同步调整 Pages 来源分支。所有资源均使用相对路径，可在文件模式或静态服务器中查看。

## 文件

```text
index.html                    页面内容与语义结构
styles.css                    响应式样式与减少动画设置
app.js                        图像生成、线性处理与交互
assets/favicon.svg            本地站点图标
.nojekyll                     禁用 Jekyll 处理
```

## 维护

有真实实验后再更新项目结果，并注明数据集、预处理、划分和指标。C++ 实现仍属于后续计划，完成验证后再改变对应状态。
