export default defineEventHandler((event) => {
  handleCors(event, {
    origin: useRuntimeConfig(event).trustedOrigin.split(','),
    methods: '*',
    credentials: true,
    preflight: {
      statusCode: 204,
    },
  })
})
