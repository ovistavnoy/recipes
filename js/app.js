(function($) {
    "use strict";

    var categories = [
        {id: 1, name: 'Супы'},
        {id: 2, name: 'Гарниры'},
        {id: 3, name: 'Салаты'},
        {id: 4, name: 'Закуски'},
        {id: 5, name: 'Десерты'}
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
            Recipe.saveRecipe(data, function(){updateListCategories()});
        });

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
        var recipes = Recipe.getRecipes(categoryId);
        for(var i=0; i<recipes.length; i++) {
            html += '<li><a class="recipe-page" data-id="'+recipes[i].id+'" href="#RecipePage">'+recipes[i].name+'</a></li>';
        }
        $('#recipes').html(html);
        $('#recipes').listview().listview('refresh');

        $("a.recipe-page").on("click", recipePage);
    }

    function recipePage() {
        var recipe = Recipe.getRecipe($(this).data('id'));
        console.log(recipe);
        $('#recipeName').text(recipe.name);
        $('#recipeContent').html('<b>Категория:</b> '+getCategoryNameById(recipe.category)+'<br><br><b>Ингридиенты:</b><div>'+recipe.ingredients+'</div><br><b>Описание:</b><div>'+recipe.description+'</div><br><b>Комментарий:</b><div>'+recipe.comment+'</div><br><b>Пробывала?</b> '+(recipe.used ? 'Да' : 'Нет'));

    }

    function getCategoryNameById(categoryId) {
        for(var i=0; i<categories.length; i++) {
            if(categories[i].id == categoryId) {
                return categories[i].name;
            }
        }
        return null;
    }


}
)(jQuery);


var Recipe = (function(){

    var storageName = 'recipes';
    var recipeList = {
        'data': [],
        'lastId': 0
    };

    function _saveRecipe(data, callback) {
        var restoreRecipes = JSON.parse(localStorage.getItem(storageName));
        console.log(restoreRecipes);

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

