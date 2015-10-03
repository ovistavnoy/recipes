jQuery.nl2br = function(varTest){
    return varTest.replace(/(\r\n|\n\r|\r|\n)/g, "<br>");
};

(function($) {
    "use strict";

    var categories = [
        {id: 1, name: 'Торты'},
        {id: 2, name: 'Печенье'},
        {id: 3, name: 'Пироги'},
        {id: 4, name: 'Десерты'},
        {id: 5, name: 'Первое'},
        {id: 6, name: 'Второе'},
        {id: 7, name: 'Мясное'},
        {id: 8, name: 'Салаты'},
        {id: 9, name: 'Напитки'}
    ];

    $(document).on("ready", function() {
        updateListCategories();

        $('#addRecipeForm').validate({
            rules: {
                name:        {required: true},
                category:    {required: true},
                ingredients: {required: true},
                description: {required: true}
            },
            messages: {
                name:        {required: "Введите имя рецепта."},
                category:    {required: "Выберите категорию."},
                ingredients: {required: "Введите ингридиенты."},
                description: {required: "Введите описание."}
            },
            errorPlacement: function (error, element) {
                var elName = element.prop('name');
                if(elName == 'name') error.appendTo(element.parent().parent());
                else                 error.appendTo(element.parent());
            },
            submitHandler: function (form) {
                saveRecipe();
                return false;
            }
        });

        $('a[href="#editorRecipePage"]').on("click", function() {
            $('#addRecipeForm').trigger('reset');
        });

        $('a[href="#CategoriesPage"]').on("click", function() {
            $('#CategoriesPage').find('input[data-type="search"]').val("");
            $('#categories').listview().listview('refresh');
        });

        $('a[href="#RecipesPage"]').on("click", function() {
            $('#RecipesPage').find('input[data-type="search"]').val("");
            $('#recipes').listview().listview('refresh');
        });

        $('#exit').on('click', function() {
            navigator.app.exitApp();
        });

        $('#clearStorage').on('click', function() {
            Recipe.clearStorage();
            updateListCategories();
        })
    });

    $( document ).on("deviceready", function(){
        StatusBar.overlaysWebView( false );
        StatusBar.backgroundColorByName("gray");
    });

    function saveRecipe() {
        var action = $('#recipe_id').val() ? 'edit' : 'create';
        var data = {
            name: $('#recipe_name').val(),
            category: $('#recipe_category').val(),
            ingredients: $('#recipe_ingredients').val(),
            description: $('#recipe_description').val(),
            comment: $('#recipe_comment').val(),
            used: ($('#recipe_used').val() == '1' ? true : false)
        };
        if(action == 'edit') {
            data.id = $('#recipe_id').val();
        }
        Recipe.saveRecipe(data, function(){
            if(action == 'edit') {
                $('#recipe_id').val('');
                $('#submitRecipe').text('Добавить');
                recipePage(data.id);
                $('.recipe-page[data-id='+data.id+']').text(data.name);
                $.mobile.back();
            } else {
                $.mobile.navigate('#mainPage');
            }
            updateListCategories();
            setTimeout(function() {$('#addRecipeForm').trigger('reset');}, 1000);
        });
    }

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
        $("a.recipe-fav").on("click", favoritePage);
    }

    function favoritePage() {
        var html = '';
        $('#categoryName').text('Любимые');
        $("a.recipe-add").hide();
        var recipes = Recipe.getFavRecipes();
        console.log(recipes)
        $('#emptyRecipes').hide();
        if(recipes.length) {
            $('#emptyFav').hide();
            $('#recipes').show();
            for(var i=0; i<recipes.length; i++) {
                html += '<li><a class="recipe-page" data-transition="slide" data-id="'+recipes[i].id+'" href="#RecipePage">'+recipes[i].name+'</a></li>';
            }
            $('#recipes').html(html);
            $('#recipes').listview().listview('refresh');
            $("a.recipe-page").on("click", recipePage);
        } else {
            $('#emptyFav').show();
            $('#recipes').hide();
        }
    }

    function categoryPage() {
        var categoryId = $(this).data('id');
        var html = '';
        $('#categoryName').text(getCategoryNameById(categoryId));
        $("a.recipe-add").show();
        $("a.recipe-add").on("click", function() {editorRecipePage(categoryId)} );
        var recipes = Recipe.getRecipes(categoryId);
        $('#emptyFav').hide();
        if(recipes.length) {
            $('#emptyRecipes').hide();
            $('#recipes').show();
            for(var i=0; i<recipes.length; i++) {
                html += '<li><a class="recipe-page" data-transition="slide" data-id="'+recipes[i].id+'" href="#RecipePage">'+recipes[i].name+'</a></li>';
            }
            $('#recipes').html(html);
            $('#recipes').listview().listview('refresh');

            $("a.recipe-page").on("click", recipePage);
        } else {
            $('#emptyRecipes').show();
            $('#recipes').hide();
        }
    }

    function editorRecipePage(data) {
        if(data instanceof Object) {
            $('#submitRecipe').text('Изменить');
            $('#recipe_id').val(data.id);
            $('#recipe_name').val(data.name);
            $('#recipe_category').val(data.category);
            $('#recipe_ingredients').val(data.ingredients);
            $('#recipe_description').val(data.description);
            $('#recipe_comment').val(data.comment);
            $('#recipe_used').val(data.used ? '1' : 0);
            $('#recipe_used').flipswitch().flipswitch("refresh");
        } else {
            $('#submitRecipe').text('Добавить');
            $('#recipe_category').val(data);
        }
        $('#recipe_category').selectmenu().selectmenu('refresh');
    }

    function recipePage(id) {
        var recipeId = id instanceof Object ? $(this).data('id') : id;
        var recipe = Recipe.getRecipe(recipeId);
        console.log(recipe)
        $("#editRecipe").unbind("click");
        $("#editRecipe").on("click", function() {
            editorRecipePage(Recipe.getRecipe(recipeId));
        });
        $("#deleteRecipe").unbind("click");
        $("#deleteRecipe").on("click", function() {
            Recipe.removeRecipe(recipeId);
            updateListCategories();
        });
        if(recipe.inFav) $("#ToggleFavRecipe").addClass('ui-alt-icon');
        else             $("#ToggleFavRecipe").removeClass('ui-alt-icon');
        $("#ToggleFavRecipe").unbind("click");
        $("#ToggleFavRecipe").click(function() {
            if(recipe.inFav) {
                Recipe.removeFromFavRecipe(recipe.id);
                favoritePage();
            } else Recipe.addToFavRecipe(recipe.id);
            $(this).toggleClass('ui-alt-icon');
            recipe.inFav = !recipe.inFav;
        });
        var html = '';
        html += '<h3 class="text-center">'+recipe.name+'</h3>';
        html += '<b>Категория:</b> '+getCategoryNameById(recipe.category)+'<br><br>';
        html += '<b>Добавлено:</b> '+getNiceDateTime(recipe.datetime)+'<br><br>';
        html += '<b>Ингридиенты:</b><div>'+ $.nl2br(recipe.ingredients)+'</div><br>';
        html += '<b>Описание:</b><div>'+$.nl2br(recipe.description)+'</div><br>';
        if(recipe.comment) {
            html += '<b>Комментарий:</b><div>'+$.nl2br(recipe.comment)+'</div><br>';
        }
        html += '<b>Пробовал Олежка?</b> '+(recipe.used ? 'Да' : 'Нет');
        $('#recipeContent').html(html);

    }

    function editRecipe() {
        return false;
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
    var storageFavName = 'recipesFav';
    var recipeList = {
        'data': [],
        'lastId': 0
    };

    function _saveRecipe(data, callback) {
        var restoreRecipes = JSON.parse(localStorage.getItem(storageName));
        if(data.id != undefined) {
            for(var i=0; i<restoreRecipes.data.length; i++) {
                if(restoreRecipes.data[i].id == data.id) {
                    restoreRecipes.data[i] = $.extend({}, restoreRecipes.data[i], data);
                    break;
                }
            }
            localStorage.setItem(storageName, JSON.stringify(restoreRecipes));
        } else {
            data.datetime = new Date().getTime();
            data.inFav = false;
            if(restoreRecipes != null) {
                data.id = ++restoreRecipes.lastId;
                restoreRecipes.data.push(data);
                localStorage.setItem(storageName, JSON.stringify(restoreRecipes));
            } else {
                data.id = ++recipeList.lastId;
                recipeList.data.push(data);
                localStorage.setItem(storageName, JSON.stringify(recipeList));
            }
        }
        if(callback != undefined) callback();
    }

    function _getRecipes(params) {
        var result = [];
        var restoreRecipes = JSON.parse(localStorage.getItem(storageName));
        if(restoreRecipes != null) {
            for(var i=0; i<restoreRecipes.data.length; i++) {
                if((params.categoryId != undefined && params.categoryId == restoreRecipes.data[i].category) ||
                   (params.ids != undefined && params.ids.indexOf(restoreRecipes.data[i].id) !== -1)
                ) {
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

    function _removeRecipe(id) {
        if(id != undefined) {
            var restoreRecipes = JSON.parse(localStorage.getItem(storageName));
            if(restoreRecipes != null) {
                for(var i=0; i<restoreRecipes.data.length; i++) {
                    if(restoreRecipes.data[i].id == id) {
                        restoreRecipes.data.splice(i, 1);
                        break;
                    }
                }
                localStorage.setItem(storageName, JSON.stringify(restoreRecipes));
            }
        }
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

    function _addToFavRecipe(id) {
        var restoreRecipes = JSON.parse(localStorage.getItem(storageFavName));
        if(restoreRecipes != null) restoreRecipes.push(id);
        else                       restoreRecipes = [id];
        localStorage.setItem(storageFavName, JSON.stringify(restoreRecipes));
        var recipe = _getRecipe(id);
        recipe.inFav = true;
        _saveRecipe(recipe);
    }

    function _removeFromFavRecipe(id) {
        var restoreRecipes = JSON.parse(localStorage.getItem(storageFavName));
        if(restoreRecipes != null) {
            var i = restoreRecipes.indexOf(id);
            if(i !== -1) {
                restoreRecipes.splice(i, 1);
                localStorage.setItem(storageFavName, JSON.stringify(restoreRecipes));
                var recipe = _getRecipe(id);
                recipe.inFav = false;
                _saveRecipe(recipe);
            }
        }
    }

    function _getFavRecipes() {
        return _getRecipes({ids: JSON.parse(localStorage.getItem(storageFavName))});
    }

    function _clearStorage() {
        localStorage.removeItem(storageName);
        localStorage.removeItem(storageFavName);
    }

    return {
        saveRecipe: function(data, callback) {
            _saveRecipe(data, callback);
        },
        getRecipes: function(categoryId) {
            return _getRecipes({categoryId: categoryId});
        },
        getRecipe: function(id) {
            return _getRecipe(id);
        },
        removeRecipe: function(id) {
            _removeRecipe(id);
        },
        countRecipeByCategories: function() {
            return _countRecipeByCategories();
        },
        getFavRecipes: function() {
            return _getFavRecipes();
        },
        addToFavRecipe: function(id) {
            _addToFavRecipe(id);
        },
        removeFromFavRecipe: function(id) {
            _removeFromFavRecipe(id);
        },
        clearStorage: function() {
            _clearStorage();
        }
    }

}());