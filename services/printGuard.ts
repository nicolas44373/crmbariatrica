// El navegador no expone la cantidad de páginas que va a generar window.print(),
// así que no se puede "leer" el resultado real. Como aproximación, medimos la altura
// que ocupa el nodo a imprimir renderizado al ancho real de la hoja y la comparamos
// contra el alto disponible (tamaño de página menos márgenes/membrete).
const PX_PER_MM = 96 / 25.4;

export interface PrintFit {
    fits: boolean;
    usedMm: number;
    availableMm: number;
}

export function checkPrintFit(node: HTMLElement, widthMm: number, availableHeightMm: number): PrintFit {
    const prevStyle = {
        position: node.style.position,
        left: node.style.left,
        top: node.style.top,
        width: node.style.width,
        display: node.style.display,
        visibility: node.style.visibility,
        maxHeight: node.style.maxHeight,
        height: node.style.height,
    };

    node.style.position = 'fixed';
    node.style.left = '-99999px';
    node.style.top = '0';
    node.style.width = `${widthMm}mm`;
    node.style.display = 'block';
    node.style.visibility = 'hidden';
    node.style.maxHeight = 'none';
    node.style.height = 'auto';

    const usedMm = node.scrollHeight / PX_PER_MM;

    Object.assign(node.style, prevStyle);

    return {
        fits: usedMm <= availableHeightMm + 1,
        usedMm,
        availableMm: availableHeightMm,
    };
}

export const PRINT_OVERFLOW_MESSAGE = 'El contenido excede el espacio de una hoja. Reduzca el texto antes de imprimir.';
