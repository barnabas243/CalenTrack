import {Stack} from 'expo-router';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WebView} from 'react-native-webview';

const htmlContent = `
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
      <title>CalenTrack Feedback form</title>
      <script async src="https://tally.so/widgets/embed.js"></script>
      <style type="text/css">
        html { margin: 0; height: 100%; overflow: hidden; }
        iframe { position: absolute; top: 0; right: 0; bottom: 0; left: 0; border: 0; }
      </style>
    </head>
    <body>
      <iframe data-tally-src="https://tally.so/r/wLdRlG?transparentBackground=1" width="100%" height="100%" frameborder="0" marginheight="0" marginwidth="0" title="CalenTrack Feedback form"></iframe>
    </body>
  </html>
`;

const PrototypeFeedbackWebView = () => {
  return (
    <>
      <Stack.Screen
        options={{title: 'CalenTrack Prototype feedback', headerBackButtonMenuEnabled: true}}
      />
      <SafeAreaView></SafeAreaView>
    </>
  );
};

export default PrototypeFeedbackWebView;
