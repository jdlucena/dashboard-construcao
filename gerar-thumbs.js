const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

ffmpeg.setFfmpegPath(ffmpegPath);

const pastaMidia = "./midia";
const pastaThumbs = "./thumbs";

if (!fs.existsSync(pastaThumbs)) {
    fs.mkdirSync(pastaThumbs, { recursive: true });
}

const imagens = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp"
];

const videos = [
    ".mp4",
    ".webm",
    ".mov",
    ".mkv",
    ".avi"
];

async function gerarThumbImagem(origem, destino) {

    try {

        await sharp(origem)
            .resize({
                width: 320,
                height: 240,
                fit: "inside",
                withoutEnlargement: true
            })
            .jpeg({
                quality: 55
            })
            .toFile(destino);

        console.log("Imagem:", destino);

    } catch (erro) {

        console.error("Erro imagem:", origem);
        console.error(erro);

    }

}

function gerarThumbVideo(origem, destino) {

    return new Promise((resolve, reject) => {

        ffmpeg(origem)
            .screenshots({
                timestamps: ["10%"],
                filename: path.basename(destino),
                folder: path.dirname(destino),
                size: "320x?"
            })
            .on("end", () => {

                console.log("Vídeo:", destino);

                resolve();

            })
            .on("error", erro => {

                console.error("Erro vídeo:", origem);
                console.error(erro);

                reject(erro);

            });

    });

}

async function processar() {

    const arquivos = fs.readdirSync(pastaMidia);

    for (const arquivo of arquivos) {

        const origem = path.join(pastaMidia, arquivo);

        const stat = fs.statSync(origem);

        if (!stat.isFile())
            continue;

        const ext = path.extname(arquivo).toLowerCase();

        const nomeBase = path.parse(arquivo).name;

        if (imagens.includes(ext)) {

            const destino = path.join(
                pastaThumbs,
                `${nomeBase}.jpg`
            );

            await gerarThumbImagem(origem, destino);

        }

        else if (videos.includes(ext)) {

            const destino = path.join(
                pastaThumbs,
                `${nomeBase}.jpg`
            );

            await gerarThumbVideo(origem, destino);

        }

    }

}

processar();