import $ from "jquery";
import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/styles.css";
import Ingredient from "./js/ingredients.js";
import Recipe from "./js/recipe.js";
import RecipeList from "./js/recipeList.js";

let ingredients = [];
let ingredientsCat = new Ingredient();
let list = [];
let recipeList = new RecipeList();

async function makeApiCallIngr() {
  const response = await Ingredient.getIngredients();
  getIngredients(response);
}

async function makeApiCallRecipe() {
  let listString = list.join(",");
  if (listString) {
    const response = await Recipe.getRecipe(listString);
    getRecipes(response);
  } else {
    $("#my-pantry").removeClass("flex");
    $("#welcomeBox").show();
    $("#loading").hide();
    $(".pagination").removeClass("flex");
  }
}

function getIngredients(response) {
  for (let i = 0; i < response.meals.length; i++) {
    $("datalist#all-ingredients").append(`<option>${response.meals[i].strIngredient.toLowerCase()}</option>`);
    ingredients.push(response.meals[i].strIngredient.toLowerCase());
  }
}


function getRecipes(response) {
  if (response) {
    const recipes = response.results;
    console.log(list.length);
    $("#my-pantry").addClass("flex");
    $("#loading").hide();
    $(".pagination").addClass("flex");
    let sortedArray = [];
    for (let i = 0; i < recipes.length; i++) {
      const recipeName = recipes[i].name;
      const imgCode = recipes[i].thumbnail_url;
      const instructions = recipes[i].instructions;
      const ingredientsSections = recipes[i].sections;
      let sections = [];
      let userCount = 0;
      let recipeCount = 0;
      for (let i = 0; i < ingredientsSections.length; i++) {
        let ingredients = [];
        
        ingredientsSections[i].components.forEach(function(ingredient) {
          ingredients.push(ingredient.raw_text);
          recipeCount++;
          list.forEach(function(userIngr) {
            if (ingredient.raw_text.toLowerCase().includes(userIngr)) {
              userCount++;
            }
          });
        });
        if (ingredientsSections[i].name === null) {
          sections.push(["Ingredients", ingredients]);
        } else {
          sections.push([ingredientsSections[i].name, ingredients]);
        }
      }

      let recipe = new Recipe(recipeName, imgCode, instructions, i, sections, userCount, recipeCount); 
      recipeList.addRecipe(recipe);
      sortedArray.push([userCount,i]);
    }
    sortedArray.sort().reverse();
    let outputStr = "";
    let page = 1;
    $("ul.pagination").empty();
    $("div.pages").empty();
    for (let i = 0; i < sortedArray.length; i++) {
      if (i % 12 === 0) {
        $("ul.pagination").append(`<li class="page-item" id="page-${page}"><a  class="page-link">${page}</a></li>`);
        $("div.pages").append(`<ul class="page-${page} fetched-recipe"></ul>`);
        page ++;
      }

      let index = sortedArray[i][1];
      let recipe = recipeList.findRecipe(index);
      outputStr = `<li id="${recipe.id}">
              <div class="card recipe-cards">
                <div class="card-body">
                  <div class="card-title-img">

                    <img src="${recipe.img}" id="recipe-img-${recipe.id}" alt="img of recipe">
                    <h4 class="heading-4">${recipe.name}</h4>
                  </div>
                    <p class="ingredient-count">You have ${recipe.userCount} out of ${recipe.recipeCount} ingredients</p>

                  </div>
                </div>
              </li>`;
      $(`ul.page-${page-1}`).append(outputStr);
    }
    $(`ul.page-1`).addClass("flex");
    clickRecipeEventListener();
  } else {
    $(".showErrors").text(`There was an error: ${response}`);
    $(".showError").slideDown(500, function() {
      $(".showError").slideUp(2000, function() {
        $(".showError").empty();
      });       
    });
  }
}

$("#pantryImg").click(function() {
  location.reload(true);
});

$(`ul.pagination`).on("click", "li", function () {
  $("div.pages").children().removeClass("flex");
  let id = $(this).attr("id");
  $(`ul.${id}`).addClass("flex");
  $("html, body").animate({ scrollTop: 0 }, "fast");
});

function clickRecipeEventListener () {
  $("ul.fetched-recipe").on("click", "li", function () {
    let recipe = recipeList.findRecipe(this.id);
    $("#recipe-sidebar").fadeIn(200);
    $("#ingredients-section").empty();
    $("#name").html(recipe.name);
    $("#recipe-detail-img").attr("src", recipe.img);
    $("#instructions").empty();

    
    for (let i = 0; i < recipe.instructions.length; i++) {
      $("#instructions").append(`<li>${recipe.instructions[i].display_text}</li>`);
    }
    for (let i = 0; i < recipe.sections.length; i++) {
      $("#ingredients-section").append(`<h3>${recipe.sections[i][0]}</h3>`);
      let ingredients = recipe.sections[i][1];
      for ( let j =0; j<ingredients.length; j++) {
        $("#ingredients-section").append(`<p>${ingredients[j]}</p>`);
      }
    }  
  });
}

function removeSpace(word) {
  word = word.replace(/" "/g, "-");
  return word;
}

function updateList() {
  $("ul#ingredients-list").empty();
  for (let i = 0; i < list.length; i++) {
    let ingredientName = list[i].replaceAll(' ','-');
    $("ul#ingredients-list").append(`<li class="shopping-list-items" id="pantry-has-${ingredientName}">${list[i]}</li>`);
    
    $(`li#pantry-has-${ingredientName}`).on("click", function () {
      removeItemFromList(`li#pantry-has-${ingredientName}`);
    });
  }
}

function removeItemFromList (id) {
  $(id).toggleClass("list-group-item-success");
  let ingredientName = id.split("-");
  if (!$(this).hasClass("list-group-item-success")) {
    let index = list.indexOf(ingredientName[2]);
    list.splice(index, 1);
    $(`li#${removeSpace(ingredientName[2])}`).removeClass("list-group-item-success");
    updateList();
  } else {
    list.push($(id).attr("id"));
    updateList();
  }
  $("ul.fetched-recipe").empty();
  $("#welcomeBox").hide();
  $("#loading").show();
  $(".pagination").removeClass("flex");
  makeApiCallRecipe();
}

function showIngredients() {
  for (let i = 0; i < ingredientsCat.proteins.length; i++) {
    $("ul#proteins").append(`<li class="list-group-item ingredients-inline" id="${removeSpace(ingredientsCat.proteins[i])}">${ingredientsCat.proteins[i]}</li>`);
  }
  for (let i = 0; i < ingredientsCat.vegetables.length; i++) {
    $("#vegetables").append(`<li class="list-group-item ingredients-inline" id="${removeSpace(ingredientsCat.vegetables[i])}">${ingredientsCat.vegetables[i]}</li>`);
  }
  for (let i = 0; i < ingredientsCat.spices.length; i++) {
    $("#spices").append(`<li class="list-group-item ingredients-inline" id="${removeSpace(ingredientsCat.spices[i])}">${ingredientsCat.spices[i]}</li>`);
  }
  for (let i = 0; i < ingredientsCat.dairy.length; i++) {
    $("#dairy").append(`<li class="list-group-item ingredients-inline" id="${removeSpace(ingredientsCat.dairy[i])}">${ingredientsCat.dairy[i]}</li>`);
  }
  for (let i = 0; i < ingredientsCat.fruits.length; i++) {
    $("#fruits").append(`<li class="list-group-item ingredients-inline" id="${removeSpace(ingredientsCat.fruits[i])}">${ingredientsCat.fruits[i]}</li>`);
  }
}

$(document).ready(function () {
  makeApiCallIngr();
  showIngredients();
});

$("ul.category").on("click", "li", function () {
  $(this).toggleClass("list-group-item-success");
  if (!$(this).hasClass("list-group-item-success")) {
    let index = list.indexOf($(this).attr("id"));
    list.splice(index, 1);
    updateList();
  } else {
    list.push($(this).attr("id"));
    updateList();
  }
  $("html, body").animate({ scrollTop: 0 }, "fast");
  $("ul.fetched-recipe").empty();
  $("#welcomeBox").hide();
  $("#loading").show();
  
  $(".pagination").removeClass("flex");
  makeApiCallRecipe();
});

$("#top").click(function () {
  $("html, body").animate({ scrollTop: 0 }, "fast");
});

$(document).on('click', function(event) {
  if ($(event.target).parents('.fetched-recipe').length > 0 || $(event.target).parents('#recipe-sidebar').length > 0 && $(event.target).attr("id") !== "close") {
    $('#recipe-sidebar').fadeIn(600);
  } else {
    //console.log($(event.target).parents('fetched-recipe').length > 0);
    $('#recipe-sidebar').fadeOut(200);
  }
});

$("form#ingredientsInput").submit(function (event) {
  event.preventDefault();
  let ingredient = $("input#ingredient").val().toLowerCase();
  if (!ingredients.includes(ingredient)) {
    $(".showError").html("Sorry, this item is not an ingredient. Please, choose from the suggestions");
    $(".showError").slideDown(500, function() {
      $(".showError").slideUp(2000, function() {
        $(".showError").empty();
      });       
    });
    
    
  } else if (list.includes(ingredient)) {
    $(".showError").html("Sorry, you already have this item on the list");
    $(".showError").slideDown(500, function() {
      $(".showError").slideUp(2000, function() {
        $(".showError").empty();
      });       
    });
  } else {
    if (ingredientsCat.proteins.includes(ingredient) || ingredientsCat.vegetables.includes(ingredient) || ingredientsCat.spices.includes(ingredient) || ingredientsCat.fruits.includes(ingredient) || ingredientsCat.dairy.includes(ingredient)) {
      $(`#${removeSpace(ingredient)}`).addClass("list-group-item-success");
    }
    list.push(ingredient);
    updateList();
    $("ul.fetched-recipe").empty();
    $("#welcomeBox").hide();
    $("#loading").show();
    makeApiCallRecipe();
    $("#ingredient").val("");

  }
});

$("#close").click(function(){
  $("#recipe-sidebar").fadeOut(300);
});


