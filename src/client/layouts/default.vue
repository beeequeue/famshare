<template>
  <div>
    <header>
      Famshare

      <pre>{{JSON.stringify(session, null, 2)}}</pre>
    </header>

    <nuxt/>
  </div>
</template>

<script>
export default {
  computed: {
    session() {
      return this.$store.state.session
    }
  }
}
</script>
