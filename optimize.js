const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

// FFmpeg 경로 설정
ffmpeg.setFfmpegPath(ffmpegPath);

// 1. 작업할 폴더 (현재 위치의 images 폴더)
const targetDir = "./images";

// 2. 폴더 확인
if (!fs.existsSync(targetDir)) {
  console.error(`❌ '${targetDir}' 폴더가 없습니다!`);
  process.exit(1);
}

// 3. 파일 읽기 및 변환 시작
fs.readdir(targetDir, (err, files) => {
  if (err) return console.error("❌ 폴더 읽기 실패:", err);

  // 변환할 파일들만 골라내기 (mp4, gif, jpg, png, jpeg)
  const targets = files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return [".mp4", ".gif", ".jpg", ".jpeg", ".png"].includes(ext);
  });

  if (targets.length === 0) {
    console.log("⚠️ 변환할 파일(mp4, gif, jpg, png)이 하나도 없습니다.");
    return;
  }

  console.log(`🔥 총 ${targets.length}개의 파일을 발견했습니다. 최적화 시작!`);

  targets.forEach((file) => {
    const ext = path.extname(file).toLowerCase();
    const inputPath = path.join(targetDir, file);
    const outputPath = path.join(targetDir, path.basename(file, ext) + ".webp"); // 확장자만 webp로 변경

    // 이미 webp 파일이 있으면 건너뛰기
    if (fs.existsSync(outputPath)) {
      // console.log(`⏩ 이미 있음 (패스): ${file}`);
      // return;
    }

    console.log(`▶ 변환 시작: ${file}`);

    let command = ffmpeg(inputPath);

    if (ext === ".mp4" || ext === ".gif") {
      // [1] 움짤/동영상 (mp4, gif) -> Animated WebP
      command.outputOptions([
        "-vcodec",
        "libwebp",
        "-lossless",
        "0",
        "-compression_level",
        "6",
        "-q:v",
        "70", // 화질 70 (낮을수록 용량 작음)
        "-loop",
        "0", // 무한 반복
        "-vf",
        "fps=10,scale=480:-1", // ⚠️ 크기 480px로 리사이징 + 프레임 10 (용량 확 줄임)
        "-y",
      ]);
    } else {
      // [2] 정지 이미지 (jpg, png) -> Static WebP
      command.outputOptions([
        "-c:v",
        "libwebp",
        "-q:v",
        "75", // 화질 75 (충분히 좋으면서 용량 작음)
        "-y",
      ]);
    }

    // 저장 실행
    command
      .save(outputPath)
      .on("end", () => {
        console.log(`✅ 완료: ${path.basename(outputPath)}`);
      })
      .on("error", (err) => {
        console.error(`❌ 실패 (${file}):`, err.message);
      });
  });
});
