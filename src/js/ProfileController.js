goog.provide('ga_profile_controller');

(function() {

  var module = angular.module('ga_profile_controller', []);

  module.controller('GaProfileController', function($scope, gaGlobalOptions) {

   $scope.options = {
      xLabel: 'profile_x_label',
      yLabel: 'profile_y_label',
      margin: {
         top: 6,
         right: 20,
         bottom: 45,
         left: 60
      },
      elevationModel: gaGlobalOptions.defaultElevationModel
    };

    $scope.$on('gaProfileActive', function(evt, feature, layer) {
      $scope.feature = feature;
      $scope.layer = layer;
    });
  });
})();

