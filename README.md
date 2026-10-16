# zxc123-sude · AI AWB & Imaging

面向相机 ISP / AI 自动白平衡（AWB）的个人作品集，使用原生 HTML、CSS 和 JavaScript，无构建步骤、无外部字体、无第三方运行时依赖。

## 内容

- 个人方向与已具备的 Python / C++ / ISP 基础。
- 首个项目 AWB-Lab 的 AI 训练框架、模型流程、数据分组与后续计划。
- 浏览器本地**经典算法对照演示**：Gray World、Max RGB、Shades of Gray（p = 6），不调用 AI 模型。
- 可切换暖光 / 冷光 / 偏绿色光的合成场景与前后对比滑块。
- JPG / PNG / WebP 本地图片输入、RGB 增益显示、恢复合成场景。

页面不宣称尚未完成的学历、工作经历、实验结果、Star 数量或 C++ 性能成绩。[AWB-Lab 源码](https://github.com/zxc123-sude/awb-lab)以可训练的 PyTorch AI AWB 为主项目，同时保留四种经典基线：Gray World、Max RGB、Shades of Gray 和 Gray Edge。

## AI AWB 当前状态

**AI 训练框架与真实缩略图 pilot 已完成；完整 RAW / 服务器实验待开展。** 交互画布仍为明确标记的经典算法演示，浏览器未加载 AI 权重，没有将经典算法包装成 AI 推理。

TinyIlluminantNet 处理流程：

```text
线性 camera RGB + 有效像素 mask（4 通道）
  → 轻量 CNN（3 层卷积）
  → 局部正 RGB 光源 + 置信度
  → 置信度加权汇聚，输出归一化全局 RGB 光源
  → 绿色归一 RGB 增益
```

训练使用 cosine 光源损失；框架提供训练、验证、测试按场景或采集组隔离的接口。本次 pilot 缺少 `scene_id`，不能核查跨组重复场景，不能据此宣称完成严格场景隔离。真实实验需要与四种经典方法使用相同划分、有效像素与评测协议比较。模型输出为 RGB 光源向量，不提供 CCT 预测。

[AI 模型与训练协议](https://github.com/zxc123-sude/awb-lab/blob/main/docs/AI_AWB.md)描述模型、训练数据与复现实验方法。ONNX / C++ 推理部署、性能优化和 ISP 集成均为后续计划。

## 真实缩略图 pilot 结果

FFCC 真实缩略图，尺寸 **32 × 48**；训练 / 验证 / 测试 **189 / 191 / 188** 张。训练 20 epochs，seed 42，CPU 2 线程；仅根据验证集选择第 18 epoch，验证集 recovery mean 为 4.3602°。188 张测试图零处理失败，同批次、相同协议比较如下：

| 方法 | Recovery mean ↓ | Median ↓ | Worst 25% mean ↓ |
| --- | ---: | ---: | ---: |
| TinyIlluminantNet（AI） | 4.0914° | 3.3442° | 8.0677° |
| Gray World | 4.8275° | 3.6976° | 10.4243° |
| White Patch / Max RGB | 4.0148° | 2.2830° | 10.1903° |
| Shades of Gray | 3.9590° | 2.3984° | 9.8163° |
| Gray Edge | 4.5113° | 2.7529° | 11.0977° |

**AI 均值 4.09°，尚未全面优于传统方法：Shades of Gray 的均值为 3.96°。** 这是单次 fold 划分的缩略图 pilot，无 `scene_id`，不是完整论文 3-fold 复现，也不是全分辨率 RAW 训练或通用性能结论。完整 RAW 与服务器实验仍待开展。

[完整 pilot 报告](https://github.com/zxc123-sude/awb-lab/blob/main/reports/ffcc_pilot/README.md)保留协议、完整结果与限制。

## 本地查看

直接打开 `index.html`，或用任意静态 HTTP 服务预览。无需安装依赖。

```powershell
python -m http.server 8000
```

在浏览器访问 `http://localhost:8000`。

## 浏览器经典演示与限制

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

后续更新 AI 模型结果时，注明数据集、camera RGB 预处理、分组划分和评测指标。当前只完成真实缩略图 pilot；完整 RAW / 服务器实验与 ONNX / C++ 部署仍为计划。浏览器若增加 AI 推理，应使用真实导出的模型并明确区分经典对照，不能给现有统计算法改名充当 AI。
