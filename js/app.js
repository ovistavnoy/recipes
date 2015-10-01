jQuery.nl2br = function(varTest){
    return varTest.replace(/(\r\n|\n\r|\r|\n)/g, "<br>");
};

(function($) {
    "use strict";

    var categories = [
        {id: 1, name: 'Гарниры'},
        {id: 2, name: 'Десерты'},
        {id: 3, name: 'Закуски'},
        {id: 4, name: 'Супы'},
        {id: 5, name: 'Салаты'},
        {id: 6, name: 'Напитки'}
    ];

    $(document).on("ready", function() {
        updateListCategories();
        $('#addRecipeForm').on('submit', function(e) {
            e.preventDefault();
            var data = {
                name: $('#recipe_name').val(),
                category: $('#recipe_category').val(),
                ingredients: $('#recipe_ingredients').val(),
                description: $('#recipe_description').val(),
                comment: $('#recipe_comment').val(),
                used: $('#recipe_used').prop('checked')
            };
            Recipe.saveRecipe(data, function(){
                $('#addRecipeForm').trigger('reset');
                updateListCategories();
            });
        });

        $('#exit').on('click', function() {
            navigator.app.exitApp();
        })
    });

    $( document ).on("deviceready", function(){
        StatusBar.overlaysWebView( false );
        StatusBar.backgroundColorByName("gray");
    });

    function updateListCategories() {
        var countCategories = Recipe.countRecipeByCategories();
        var listHtml = '';
        var SelectHtml = '<option value="">Выберите категорию</option>';

        $('#recipe_category').html('');
        categories.sort(sName);
        for(var i=0; i<categories.length; i++) {
            var count = 0;
            if(countCategories[categories[i].id] != undefined) {
                count = countCategories[categories[i].id];
            }
            listHtml += '<li><a data-transition="slide" class="recipe-category" data-id="'+categories[i].id+'" href="#RecipesPage">'+categories[i].name+'<span class="ui-li-count">'+count+'</span></a></li>';
            SelectHtml += '<option value="'+categories[i].id+'">'+categories[i].name+'</option>';
        }
        $('#categories').html(listHtml);
        $('#categories').listview().listview('refresh');
        $('#recipe_category').html(SelectHtml);

        $("a.recipe-category").on("click", categoryPage);
    }

    function categoryPage() {
        var categoryId = $(this).data('id');
        var html = '';
        $('#categoryName').text(getCategoryNameById(categoryId));
        $('#addRecipe').data('category_id', categoryId);
        $("a.recipe-add").on("click", addRecipePage);
        var recipes = Recipe.getRecipes(categoryId);
        if(recipes.length) {
            $('#emptyRecipes').hide();
            $('#recipes').show();
            $('.ui-filterable').show();
            for(var i=0; i<recipes.length; i++) {
                html += '<li><a class="recipe-page" data-id="'+recipes[i].id+'" href="#RecipePage">'+recipes[i].name+'</a></li>';
            }
            $('#recipes').html(html);
            $('#recipes').listview().listview('refresh');

            $("a.recipe-page").on("click", recipePage);
        } else {
            $('#emptyRecipes').show();
            $('#recipes').hide();
            $('.ui-filterable').hide();
        }

    }

    function addRecipePage() {
        var categoryId = $(this).data('category_id');
        if(categoryId) {
            $('#recipe_category').val(categoryId);
            $('#recipe_category').selectmenu('refresh');
        }

    }

    function recipePage() {
        var recipe = Recipe.getRecipe($(this).data('id'));
        console.log(recipe);
        $('#recipeName').text(recipe.name);
        var html = '';
        html += '<b>Категория:</b> '+getCategoryNameById(recipe.category)+'<br><br>';
        html += '<b>Добавлено:</b> '+getNiceDateTime(recipe.datetime)+'<br><br>';
        html += '<b>Ингридиенты:</b><div>'+ $.nl2br(recipe.ingredients)+'</div><br>';
        html += '<b>Описание:</b><div>'+$.nl2br(recipe.description)+'</div><br>';
        if(recipe.comment) {
            html += '<b>Комментарий:</b><div>'+$.nl2br(recipe.comment)+'</div><br>';
        }
        html += '<b>Пробывала?</b> '+(recipe.used ? 'Да' : 'Нет');

        $('#recipeContent').html(html);

    }

    function getCategoryNameById(categoryId) {
        for(var i=0; i<categories.length; i++) {
            if(categories[i].id == categoryId) {
                return categories[i].name;
            }
        }
        return null;
    }

    function getNiceDateTime(datetime) {
        var result = '';
        if(datetime != undefined) {
            var d = new Date(datetime);
            result += d.getDate() < 10 ? '0'+d.getDate() : d.getDate();
            result += '.';
            result += d.getMonth() < 10 ? '0'+d.getMonth() : d.getMonth();
            result += '.';
            result += d.getFullYear();
            result += ' ';
            result += d.getHours() < 10 ? '0'+d.getHours() : d.getHours();
            result += ':';
            result += d.getMinutes() < 10 ? '0'+d.getMinutes() : d.getMinutes();

        }
        return result;
    }


}
)(jQuery);

function sName(i, ii) {
    if (i.name > ii.name)
        return 1;
    else if (i.name < ii.name)
        return -1;
    else
        return 0;
}

var Recipe = (function(){

    var storageName = 'recipes';
    var recipeList = {
        'data': [],
        'lastId': 0
    };

    function _saveRecipe(data, callback) {
        var restoreRecipes = JSON.parse(localStorage.getItem(storageName));
        data.datetime = new Date().getTime();
        if(restoreRecipes != null) {
            data.id = ++restoreRecipes.lastId;
            restoreRecipes.data.push(data);
            localStorage.setItem(storageName, JSON.stringify(restoreRecipes));
        } else {
            data.id = ++recipeList.lastId;
            recipeList.data.push(data);
            localStorage.setItem(storageName, JSON.stringify(recipeList));
        }
        callback();
        $.mobile.navigate($('#addRecipeForm').attr('action'));
    }

    function _getRecipes(categoryId) {
        var result = [];
        var restoreRecipes = JSON.parse(localStorage.getItem(storageName));
        if(restoreRecipes != null) {
            for(var i=0; i<restoreRecipes.data.length; i++) {
                if((categoryId != undefined && categoryId == restoreRecipes.data[i].category) || categoryId == undefined) {
                    result.push(restoreRecipes.data[i]);
                }
            }
            result.sort(sName)
        }

        return result;
    }

    function _getRecipe(id) {
        if(id != undefined) {
            var restoreRecipes = JSON.parse(localStorage.getItem(storageName));
            if(restoreRecipes != null) {
                for(var i=0; i<restoreRecipes.data.length; i++) {
                    if(restoreRecipes.data[i].id == id) {
                        return restoreRecipes.data[i];
                    }
                }
            }
        }
        return null;
    }

    function _countRecipeByCategories() {
        var result = {};
        var restoreRecipes = JSON.parse(localStorage.getItem(storageName));
        if(restoreRecipes != null) {
            for(var i=0; i<restoreRecipes.data.length; i++) {
                if(result[restoreRecipes.data[i].category] == undefined) result[restoreRecipes.data[i].category] = 0;
                result[restoreRecipes.data[i].category]++;
            }
        }
        return result;

    }


    return {
        saveRecipe: function(data, callback) {
            _saveRecipe(data, callback);
        },
        getRecipes: function(categoryId) {
            return _getRecipes(categoryId);
        },
        getRecipe: function(id) {
            return _getRecipe(id);
        },
        countRecipeByCategories: function() {
            return _countRecipeByCategories();
        }
    }

}());

