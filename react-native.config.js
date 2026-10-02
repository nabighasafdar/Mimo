// @react-native-voice/voice is incompatible with current Gradle (jcenter, no compileSdk).
// Excluded from autolinking until voice input is implemented.
module.exports = {
  assets: ['./assets/fonts'],
  dependencies: {
    '@react-native-voice/voice': {
      platforms: {android: null},
    },
  },
};
