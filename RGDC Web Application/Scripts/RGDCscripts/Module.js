var app = angular.module("RGDCWebApplication", [])

app.directive('onFinishRender', function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope) {

            if (scope.$last) {
                $timeout(function () {

                    const tableId = '#adminFinance';

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

app.directive('onFinishRender', function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope) {

            if (scope.$last) {
                $timeout(function () {

                    const tableId = '#adminFinanceArchive';

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