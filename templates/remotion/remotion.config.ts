// Remotion CLI config (studio + render). See https://www.remotion.dev/docs/config
import { Config } from "@remotion/cli/config";

// ONE master file per video at the best quality (owner, 2026-10-16): lossless PNG frames into the
// encoder (JPEG frames cost a lossy step before x264 even starts) and CRF 12 instead of Remotion's 18.
// The CRF literal must equal MASTER_CRF in pipeline/shared/lib/encode.mjs (encode.test.mjs pins it).
Config.setVideoImageFormat("png");
Config.setCrf(12);
Config.setOverwriteOutput(true);
Config.setConcurrency(2); // modest default for a 4-core / 16GB orchestrator
