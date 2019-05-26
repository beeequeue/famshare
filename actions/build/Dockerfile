FROM node:12-slim

# Labels for GitHub to read your action
LABEL "com.github.actions.name"="build"
LABEL "com.github.actions.description"="Compiles project"
# Here are all of the available icons: https://feathericons.com/
LABEL "com.github.actions.icon"="minimize-2"
# And all of the available colors: https://developer.github.com/actions/creating-github-actions/creating-a-docker-container/#label
LABEL "com.github.actions.color"="white"

LABEL "repository"="https://github.com/BeeeQueue/famshare"
LABEL "homepage"="https://github.com/BeeeQueue/famshare/tree/master/actions/build"
LABEL "maintainer"="BeeeQueue <adam.lj.haglund@gmail.com>"

# Run `node /entrypoint.ts`
ENTRYPOINT ["yarn", "-s", "ts-node", "--transpile-only", "actions/build/entrypoint.ts"]
