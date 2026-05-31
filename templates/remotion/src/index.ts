// Remotion entry point. The CLI looks for this file by default and renders
// whatever RemotionRoot registers.
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
