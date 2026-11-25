# 音频文件夹说明（public/audio）

本目录存放考试的“时间点提示音频”。应用在运行时读取 `manifest.json`，按登记的文件名
在 `public/audio/` 下加载对应音频。

## 使用方法

1. **替换占位**：将同名真实音频放入本目录（例如用你的 `start.mp3` 替换 `start.wav` 时，
   请把文件名改为 `start.wav`，或删除旧条目并新增条目）。
2. **新增音频**：把文件放入本目录，然后在 `manifest.json` 追加一条记录，例如：

   ```json
   { "file": "teacher-note.mp3", "label": "监考老师语音" }
   ```

   支持的格式取决于浏览器：`.mp3 / .wav / .m4a / .ogg / .flac`。

3. 在“考试配置 → 时间点提示音频 → audio 文件夹”标签中即可选用。

## 占位文件

`start.wav / warn.wav / end.wav / custom.wav` 为脚本生成的短提示音（占位用），
可用 `npm run gen:audio` 重新生成。考试节点若不选择任何文件，系统会使用
**内置合成提示音**（WebAudio），无需音频文件也能发声。
