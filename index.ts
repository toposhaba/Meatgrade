import { Buffer } from "buffer";
import { registerRootComponent } from "expo";
import App from "./App";

if (typeof globalThis.Buffer === "undefined") {
  globalThis.Buffer = Buffer;
}

registerRootComponent(App);
