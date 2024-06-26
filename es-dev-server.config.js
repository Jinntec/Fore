// Also run the websocket server now
require('./websocket-server.js');

module.exports = {
  port: 8090,
  watch: true,
  nodeResolve: true,
  appIndex: './index.html',
  plugins: [
    {
      transform(context) {
        context.response.set('Access-Control-Allow-Origin', 'http://localhost:8080');
        return {
          body: context.body,
        };
      },

      serve(context) {
        console.log('context path ', context);
        if (context.originalUrl === '/login') {
          console.log('>>>> context ', context);
          context.response.status = 200;
          return { body: 'success', type: 'text' };
        }
        if (context.originalUrl === '/submission1') {
          console.log('>>>> context ', context);
          context.response.status = 200;
          return { body: '<data></data>', type: 'xml' };
        }
        if (context.originalUrl === '/submission2?foo=bar&param2=value2') {
          const foo = context.URL.searchParams.get('foo');
          const param = context.URL.searchParams.get('param2');
          context.response.status = 200;
          return {
            body: `Params received: <ul><li>foo=${foo}</li><li>param2=${param}</li></ul>`,
            type: 'text',
          };
        }
        if (context.originalUrl === '/submission2') {
          // console.log('>>>> context ', context);
          context.response.status = 200;
          return { body: '<data><greeting>Hi from response</greeting></data>', type: 'xml' };
        }
        if (context.originalUrl === '/submission2?foo=bar') {
          // console.log('>>>> context ', context);
          context.response.status = 200;
          return {
            body: '<data><greeting>Hi from response - got params</greeting></data>',
            type: 'xml',
          };
        }
        if (context.originalUrl === '/submissionfails') {
          // console.log('>>>> context ', context);
          context.response.status = 200;
          return { body: '<data>', type: 'xml' };
        }
        if (context.originalUrl === '/replaceall') {
          // console.log('>>>> context ', context);
          context.response.status = 200;
          return {
            body: '<div>Thanks for being here</div>',
            type: 'html',
          };
        }
        if (context.originalUrl === '/redirect') {
          // console.log('>>>> context ', context);
          context.response.status = 200;
          return {
            body: '/index.html',
            type: 'text',
          };
        }
        return null;
      },
    },
  ],
  moduleDirs: ['node_modules', 'web_modules'],
};
