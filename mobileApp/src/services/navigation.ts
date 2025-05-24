// Simple navigation service for React Native
// In a real app, you would use React Navigation

let _navigator;

function setTopLevelNavigator(navigatorRef) {
  _navigator = navigatorRef;
}

function navigate(routeName, params) {
  if (_navigator && routeName) {
    _navigator.navigate(routeName, params);
  }
}

function goBack() {
  if (_navigator) {
    _navigator.goBack();
  }
}

export default {
  setTopLevelNavigator,
  navigate,
  goBack,
};
