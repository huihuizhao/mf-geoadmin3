goog.provide('ga_profilepopup_controller');

goog.require('ga_browsersniffer_service');
goog.require('ga_print_service');

(function() {

  var module = angular.module('ga_profilepopup_controller', [
    'ga_browsersniffer_service',
    'ga_print_service'
  ]);

  module.controller('GaProfilePopupController', function($scope, $timeout,
      gaPrintService, gaBrowserSniffer) {

    $scope.options = {
      title: 'draw_popup_title_measure',
      position: 'fixed',
      showPrint: true,
      print: function() {
        $scope.$broadcast('gaPrintBefore');
        var popupContent = $('#profile-popup .ga-popup-content');
        gaPrintService.htmlPrintout(popupContent.html());
        $scope.$broadcast('gaPrintAfter');
      }
    };

    $scope.$on('gaProfileActive', function(evt, feature, layer, callback) {
      $scope.toggle = !!(feature);
      $scope.options.isReduced = false;
      if (callback) {
        // Remove the feature correctly (without digest cycle error)
        var unreg = $scope.$watch('toggle', function(newValue, oldValue) {
          if (oldValue && !newValue) { //The popup is closing
            callback(feature);
            unreg();
          }
        });
      }
    });

    $scope.$on('gaDrawStyleActive', function(evt, feature) {
      if (feature) {
        $scope.toggle = false;
        $scope.options.isReduced = false;
      }
    });
  });
})();
