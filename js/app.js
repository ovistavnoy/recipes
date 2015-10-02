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
                name:        {required: "Please enter recipe name."},
                category:    {required: "Please choose category."},
                ingredients: {required: "Please enter ingredients."},
                description: {required: "Please enter description."}
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

        $('#exit').on('click', function() {
            navigator.app.exitApp();
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
            console.log('callback')
            $('#addRecipeForm').trigger('reset');
            console.log(5);
            if(action == 'edit') {
                console.log(6);
                $('#recipe_id').val('');
                $('#submitRecipe').text('Добавить');
                recipePage(data.id);
                $('.recipe-page[data-id='+data.id+']').text(data.name);
                $.mobile.back();
            } else {
                console.log(7);
                $.mobile.navigate('#mainPage');
            }
            console.log(8);
            updateListCategories();
            console.log(9);
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
    }

    function categoryPage() {
        var categoryId = $(this).data('id');
        var html = '';
        $('#categoryName').text(getCategoryNameById(categoryId));
        $("a.recipe-add").on("click", function() {editorRecipePage(categoryId)} );
        var recipes = Recipe.getRecipes(categoryId);
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
        console.log('editor');
        console.log(data);
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
        var recipeId;
        if(id instanceof Object) {
            recipeId = $(this).data('id');
        } else {
            recipeId = id;
        }

        var recipe = Recipe.getRecipe(recipeId);
        $("#editRecipe").on("click", function() {
            editorRecipePage(Recipe.getRecipe(recipeId));
        });
        $("#deleteRecipe").on("click", function() {
            Recipe.removeRecipe(recipeId);
            updateListCategories();
        });
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
        html += '<b>Пробывал Олежка?</b> '+(recipe.used ? 'Да' : 'Нет');

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
    var recipeList = {
        'data': [],
        'lastId': 0
    };

    function _saveRecipe(data, callback) {
        var restoreRecipes = JSON.parse(localStorage.getItem(storageName));
        if(data.id != undefined) {
            console.log('Update');
            for(var i=0; i<restoreRecipes.data.length; i++) {
                if(restoreRecipes.data[i].id == data.id) {
                    restoreRecipes.data[i] = $.extend({}, restoreRecipes.data[i], data);
                    break;
                }
            }
            localStorage.setItem(storageName, JSON.stringify(restoreRecipes));
        } else {
            console.log('Add');
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
        }
        console.log(11);

        callback();
        console.log(33);

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
       // localStorage.setItem(storageName, JSON.stringify(recipeList));
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
        removeRecipe: function(id) {
            return _removeRecipe(id);
        },
        countRecipeByCategories: function() {
            return _countRecipeByCategories();
        }
    }

}());