export default defineEventHandler((event) => {
  handleCors(event, {
    origin: ['http://localhost:3001', 'https://demo-auth-nu.vercel.app'],
    methods: '*',
    credentials: true,
    preflight: {
      statusCode: 204,
    },
  })
})
