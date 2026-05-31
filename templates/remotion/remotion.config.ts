// Remotion CLI config (studio + render). See https://www.remotion.dev/docs/config
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(2); // modest default for a 4-core / 16GB orchestrator
