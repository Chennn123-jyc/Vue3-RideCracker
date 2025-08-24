<template>
    <div class="bottom-navigation">
        <div class="nav-items-container">
            <nav-item
            icon="bicycle"
            label="运动"
            route="/"
            :is-active="$route.name === 'sport'"
            />
            <nav-item 
        icon="music" 
        label="音乐" 
        route="/music"
        :is-active="$route.name === 'music'"
      />
        </div>
    </div>
</template>

<script setup lang="ts" name="BottomNavigation">
import NavItem from './NavItem.vue';
</script>

<style scoped>
.bottom-navigation{
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #111827;
    z-index: 50;
    padding-bottom: env(safe-area-inset-bottom);
    border-top: 1px solid #1f2937;
    width: 100%;
    left: 0;
    right: 0;
    margin: 0;
    max-width: 100vw;
}
.nav-items-container{
    display: flex;
    justify-content: space-around;
    align-items: center;
    height: 4rem;
    padding: 0 8px;
    box-sizing: border-box;
}
</style>