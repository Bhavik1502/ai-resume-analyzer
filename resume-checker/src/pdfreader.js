import * as pdfjsLib from "pdfjs-dist";
import worker from "pdfjs-dist/build/pdf.worker?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = worker;

export const extractTextFromPDF = async (file) => {
  const fileReader = new FileReader();

  return new Promise((resolve, reject) => {
    fileReader.onload = async function () {
      try {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;

        let text = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();

          content.items.forEach((item) => {
            text += item.str + " ";
          });
        }

        resolve(text);
      } catch (err) {
        reject(err);
      }
    };

    fileReader.readAsArrayBuffer(file);
  });
};