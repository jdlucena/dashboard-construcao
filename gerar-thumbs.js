const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const ffprobePath = require("ffprobe-static").path;

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const pastaMidia = "./midia";
const pastaThumbs = "./thumbs";

if (!fs.existsSync(pastaThumbs)) {
    fs.mkdirSync(pastaThumbs, { recursive: true });
}

const imagens = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
const videos = [".mp4", ".webm", ".mov", ".mkv", ".avi"];

function precisaGerar(origem, destino) {

    if (!fs.existsSync(destino)) return true;

    const tOrigem = fs.statSync(origem).mtimeMs;
    const tDestino = fs.statSync(destino).mtimeMs;

    return tOrigem > tDestino; // só atualiza se original for mais novo
}

async function gerarImagem(origem, destino) {

    if (!precisaGerar(origem, destino)) {
        console.log("SKIP imagem:", path.basename(origem));
        return;
    }

    await sharp(origem)
        .resize({
            width: 320,
            fit: "inside",
            withoutEnlargement: true
        })
        .jpeg({ quality: 60 })
        .toFile(destino);

    console.log("OK imagem:", path.basename(destino));
}

function gerarVideo(origem, destino) {

    return new Promise((resolve, reject) => {

        if (!precisaGerar(origem, destino)) {
            console.log("SKIP vídeo:", path.basename(origem));
            return resolve();
        }

        ffmpeg(origem)
            .on("end", () => {
                console.log("OK vídeo:", path.basename(destino));
                resolve();
            })
            .on("error", err => {
                console.error("ERRO vídeo:", origem);
                reject(err);
            })
            .screenshots({
                timestamps: ["10%"],
                filename: path.basename(destino),
                folder: path.dirname(destino),
                size: "320x?"
            });
    });
}

async function processar() {

    const arquivos = fs.readdirSync(pastaMidia);

    for (const arquivo of arquivos) {

        const origem = path.join(pastaMidia, arquivo);

        if (!fs.statSync(origem).isFile()) continue;

        const ext = path.extname(arquivo).toLowerCase();
        const nomeBase = path.parse(arquivo).name;

        const destino = path.join(pastaThumbs, `${nomeBase}.jpg`);

        if (imagens.includes(ext)) {
            await gerarImagem(origem, destino);
        }

        else if (videos.includes(ext)) {
            await gerarVideo(origem, destino);
        }
    }
}

processar();