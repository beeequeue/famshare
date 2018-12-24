<template>
  <div>
    <header>
      <span class="logo">Famshare</span>

      <span v-if="session" class="name"> {{ username }} </span>

      <a v-else href="/discord/login" class="login"> Login </a>
    </header>

    <nuxt />
  </div>
</template>

<script>
export default {
  computed: {
    session() {
      return this.$store.state.session
    },
    username() {
      return this.$store.state.username
    },
  },
}
</script>

<style lang="scss">
body {
  --main: #6fc776;
  --bg: #eee;

  margin: 0;
  background: var(--bg);

  font-family: 'Source Sans Pro', sans-serif;
}

header {
  display: flex;
  align-items: center;
  background: var(--main);
  font-size: 1.5rem;
  padding: 10px 15px;

  & > .logo {
    font-weight: 600;
  }

  & > .name,
  & > .login {
    margin-left: auto;
  }

  & > .login {
    cursor: pointer;
  }
}
</style>
