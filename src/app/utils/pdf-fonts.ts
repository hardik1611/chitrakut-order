declare const require: any;

export const pdfFonts = {
  Roboto: {
    normal: require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-Regular.ttf'],
    bold: require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-Medium.ttf'],
    italics: require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-Italic.ttf'],
    bolditalics: require('pdfmake/build/vfs_fonts.js').pdfMake.vfs['Roboto-MediumItalic.ttf']
  }
};