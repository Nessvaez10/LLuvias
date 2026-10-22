import JSZip from 'jszip';

// Load source code files as raw strings for instant client-side packaging
const sourceFiles = import.meta.glob<string>(
  [
    '../**/*.{ts,tsx,css}',
    '../../index.html',
    '../../package.json',
    '../../tsconfig.json',
    '../../vite.config.ts',
    '../../public/data/hidalgo_municipios.geojson'
  ],
  { query: '?raw', import: 'default', eager: true }
);

export async function downloadProjectAsZip(onProgress?: (msg: string) => void): Promise<void> {
  const zip = new JSZip();

  if (onProgress) onProgress('Preparando archivos del código fuente...');

  // Add source files
  for (const [rawPath, content] of Object.entries(sourceFiles)) {
    // Normalize path relative to project root
    let cleanPath = rawPath.replace(/^\.\.\/\.\.\//, '').replace(/^\.\.\//, 'src/');
    if (cleanPath.startsWith('src/src/')) {
      cleanPath = cleanPath.replace('src/src/', 'src/');
    }
    zip.file(cleanPath, content);
  }

  // Include a clear and friendly README.md
  const readmeContent = `# Sistema de Monitoreo de Afectaciones Meteorológicas de Hidalgo

Plataforma interactiva SIG y de Protección Civil para el monitoreo, semaforización municipal y trazabilidad de afectaciones meteorológicas en los 84 municipios del Estado de Hidalgo.

## Requisitos Previos
- Node.js (versión 18 o superior recomendada)
- npm o bun

## Instalación y Ejecución Local

1. Instalar dependencias:
\`\`\`bash
npm install
\`\`\`

2. Iniciar el servidor de desarrollo:
\`\`\`bash
npm run dev
\`\`\`

3. Abre tu navegador en:
\`\`\`
http://localhost:3000
\`\`\`

## Construcción para Producción
\`\`\`bash
npm run build
\`\`\`

## Estructura del Proyecto
- \`src/components/\`: Componentes del mapa interactivo Leaflet, semáforo, dashboard y tablas.
- \`src/data/\`: Base de datos oficial de incidentes y coordenadas de los 84 municipios.
- \`src/utils/\`: Lógica algorítmica de semaforización oficial, cálculo de afectaciones y exportación.
- \`public/data/\`: GeoJSON vectorial oficial con los polígonos de los municipios de Hidalgo.
`;

  zip.file('README.md', readmeContent);

  // Add .gitignore
  const gitignoreContent = `node_modules
dist
.env
.DS_Store
`;
  zip.file('.gitignore', gitignoreContent);

  if (onProgress) onProgress('Generando archivo ZIP...');

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sistema-monitoreo-hidalgo-${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  if (onProgress) onProgress('¡Descarga completada!');
}
