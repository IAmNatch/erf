import React from "react";
import { render } from "react-dom";
import { App } from "./components/App";

// If you want to add custom plugins or presets, you can register them
// at plugins-list.js

const BABEL_CONFIG = `{
  "presets": [
    ["@babel/preset-env", {
      "targets": "Edge 16"
    }]
  ]
}`;

const SOURCE = `class A {
  foo: string | void; // initialized to undefined
  declare bar: number; // type-only
}`;

const PLUGIN = `export default function (babel) {
  const { types: t } = babel;
  
  return {
    manipulateOptions(opts, parserOpts) {
      parserOpts.plugins.push(
        "typescript",
      );
    },
    name: "convert-class-fields-to-declare",
    visitor: {
      ClassProperty(path) {
        if (path.get('typeAnnotation').isTSTypeAnnotation() && !path.node.declare) {
          let clone = t.cloneNode(path.node);
          clone.declare = true;
          path.replaceWith(clone);
        }
      }
    }
  };
}`;

render(
  <App
    defaultBabelConfig={BABEL_CONFIG}
    defaultSource={SOURCE}
    defCustomPlugin={PLUGIN}
  />,
  document.getElementById("root")
);
