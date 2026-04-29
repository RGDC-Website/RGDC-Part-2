var app = angular.module("RGDCWebApplication", [])

app.directive('onFinishRender', function ($timeout) {
    return {
        restrict: 'A',
        scope: {
            tableId: '@'
        },
        link: function (scope) {
            if (scope.$parent.$last) {
                $timeout(function () {

                    const tableId = '#' + scope.tableId;

                    if ($.fn.DataTable.isDataTable(tableId)) {
                        $(tableId).DataTable().destroy();
                    }

                    $(tableId).DataTable({
                        paging: true,
                        searching: true,
                        ordering: true,
                        responsive: true,
                        autoWidth: false
                    });

                }, 0);
            }
        }
    };
});