workflow "Build" {
  on = "push"
  resolves = [
    "Compile project",
    "Install Dependencies",
  ]
}

action "Install Dependencies" {
  uses = "nuxt/actions-yarn@97f98f200b7fd42a001f88e7bdfc14d64d695ab2"
  args = "install"
}

action "Compile project" {
  uses = "./actions/build"
  secrets = ["GITHUB_TOKEN"]
  needs = ["Install Dependencies"]
}
