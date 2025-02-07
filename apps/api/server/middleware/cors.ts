export default defineEventHandler((event) => {
  handleCors(event, {
    origin: ['http://localhost:3001'],
    methods: '*',
    credentials: true,
    preflight: {
      statusCode: 204,
    },
  })
})
