/**
 * Nota: Cuando se usan las APIs de Node.js, el archivo de configuración
 * no se aplica automáticamente. En su lugar, pasa las opciones directamente a las APIs.
 *
 * Todas las opciones de configuración: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
// Three.js necesita ANGLE (GPU) para renderizar en Chrome headless.
Config.setChromiumOpenGlRenderer("angle");
