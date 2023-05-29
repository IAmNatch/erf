module.exports = function ({ types: t }) {
  function addProfilerImportAndWrapComponent(path, componentName) {
    const { node } = path;

    // Find all instances of the specified hook inside react components
    if (
      t.isCallExpression(node.init) &&
      t.isIdentifier(node.init.callee) &&
      node.init.callee.name === "use" &&
      t.isVariableDeclarator(path.node)
    ) {
      const hookUsages = path.scope.getFunctionParent().path.scope.bindings[
        node.id.name
      ].referencePaths;

      // Iterate over each hook usage
      hookUsages.forEach((referencePath) => {
        const component = referencePath.scope.getFunctionParent().node.id.name;

        // Find the parent component usage (either JSX or value)
        const parentComponentUsage = referencePath.findParent(
          (p) =>
            t.isJSXOpeningElement(p.node) &&
            t.isJSXIdentifier(p.node.name, { name: component })
        );

        // Check if parentComponentUsage exists and is not empty
        if (parentComponentUsage) {
          // Add import statement for React.Profiler
          const programPath = referencePath.findParent((p) => p.isProgram());
          const reactImport = programPath.node.body.find(
            (node) =>
              t.isImportDeclaration(node) && node.source.value === "react"
          );

          if (!reactImport) {
            programPath.unshiftContainer(
              "body",
              t.importDeclaration(
                [t.importSpecifier(t.identifier("Profiler"))],
                t.stringLiteral("react")
              )
            );
          } else {
            const existingSpecifier = reactImport.specifiers.find(
              (specifier) =>
                t.isImportSpecifier(specifier) &&
                specifier.imported.name === "Profiler"
            );

            if (!existingSpecifier) {
              reactImport.specifiers.push(
                t.importSpecifier(t.identifier("Profiler"))
              );
            }
          }

          // Wrap the parent component in a <React.Profiler>
          parentComponentUsage.replaceWith(
            t.jsxElement(
              t.jsxOpeningElement(
                t.jsxMemberExpression(
                  t.jsxIdentifier("React"),
                  t.jsxIdentifier("Profiler")
                ),
                [
                  t.jsxAttribute(
                    t.jsxIdentifier("id"),
                    t.stringLiteral(component)
                  )
                ]
              ),
              t.jsxClosingElement(
                t.jsxMemberExpression(
                  t.jsxIdentifier("React"),
                  t.jsxIdentifier("Profiler")
                )
              ),
              [parentComponentUsage.node]
            )
          );
        }
      });
    }
  }

  return {
    visitor: {
      VariableDeclarator(path) {
        const { node } = path;

        // Replace 'specificHookName' with the name of your specific React hook
        addProfilerImportAndWrapComponent(path, "specificHookName");
      }
    }
  };
};
