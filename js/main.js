let eventBus = new Vue()
Vue.component('Cards', {
    template: `
       <div class="Cards">
       <h1>Заметки</h1>
       <create_card></create_card>
        <p class="error" v-for="error in errors">{{ error }}</p>
           <div class="cards_inner">
                <div class="cards_item">
                    <h2 id="h2_one">Новые</h2>
                    <columns1 :columnFirst="columnFirst"></columns1>
                </div>
                <div class="cards_item">
                <h2 id="h2_two">В процессе</h2>
                    <columns2 :columnSecond="columnSecond"></columns2>
                </div>
                <div class="cards_item">
                <h2 id="h2_three">Завершенные</h2>
                    <columns3 :columnThird="columnThird"></columns3>
                </div>
           </div>
       </div>`,
    data() {
        return {
            columnFirst:[],
            columnSecond:[],
            columnThird:[],
            errors: []
        }
    },
    mounted() {
        eventBus.$on('card-submitted', card => {
            this.errors = []
            if(this.columnFirst.length < 3){
                this.columnFirst.push(card)
            }else {
                this.errors.push('В первой колонке нельзя добавить больше 3-х карточек.')
            }
        })
        eventBus.$on('addColumnSecond', card => {
            this.errors = []
            if(this.columnSecond.length < 5){
                this.columnSecond.push(card)
                this.columnFirst.splice(this.columnFirst.indexOf(card), 1)
            }else if (this.columnSecond.length === 5) {
                this.errors.push('You need to complete card in the second column to add new card or complete card in the first column')
                if(this.columnFirst.length > 0) {
                    this.columnFirst.forEach(item => {
                        item.arrTask.forEach(item => {
                            item.completed = true;
                        })
                    })
                }
            }
        })
        eventBus.$on('addColumnThird', card =>{
            this.columnThird.push(card)
            this.columnSecond.splice(this.columnSecond.indexOf(card), 1)

        if(this.columnSecond.length < 5) {
            if(this.columnFirst.length > 0) {
                this.columnFirst.forEach(item => {
                    item.arrTask.forEach(item => {
                        item.completed = false;
                    })
                })
            }
        }
        })
        eventBus.$on('addColumnOneThird', card =>{

            if (this.columnSecond.length >= 5) {
                this.errors.push("Вы не можете редактировать первую колонку, пока есть во второй есть 5 карточек")
            } else {
                this.columnThird.push(card)
                this.columnFirst.splice(this.columnFirst.indexOf(card), 1)
            }
        })

    },

})

Vue.component('Columns1', {
    template: `
       <div class="Column">
            <div class="column_div" v-for="card in columnFirst"><h2>{{card.name}}</h2>
                <span>
                    <li v-for="task in card.arrTask" v-if="task.title != null" >
                            <strong>{{task.id}}</strong>
                            <input type="checkbox" 
                            :disabled="task.completed" 
                            @change.prevent="updateColumn(card, task)"
                            
                            >
                            <span :class="{done: task.completed}" >{{task.title}}</span>
                    </li>
                </span>
            </div>
       </div>`,

    props: {
        columnFirst:{
            type: Array,

        },
        errors: {
            type: Array,
        }

    },
    methods: {
        updateColumn(card, task) {
            card.status += 1
            task.completed = true
            let cardTask = 0
            for(let i = 0; i < 5; i++){
                if (card.arrTask[i].title != null) {
                    cardTask++
                }
            }
            if ((card.status / cardTask) * 100 >= 50) {
                eventBus.$emit('addColumnSecond', card)
            }
            if ((card.status / cardTask) * 100 === 100) {
                card.data = new Date().toLocaleString()
                eventBus.$emit('addColumnOneThird', card)
            }

        },
    },

})

Vue.component('Columns2', {
    template: `
       <div class="Column">
            <div class="column_div" v-for="card in columnSecond"><h2>{{card.name}}</h2>
                <span>
                    <li v-for="task in card.arrTask" v-if="task.title != null" >
                            <strong>{{task.id}}</strong>
                            <input type="checkbox"
                            :disabled="task.completed" 
                            @change.prevent="updateColumnTwo(card, task)"
                            >
                            <span :class="{done: task.completed}" >{{task.title}}</span>
                    </li>
                </span>
            </div>
       </div>`,
    props: {
        columnSecond:{
            type: Array,

        }

    },
    methods: {
        updateColumnTwo(card, task) {
            card.status += 1
            task.completed = true
            let cardTask = 0
            for(let i = 0; i < 5; i++){
                if (card.arrTask[i].title != null) {
                    cardTask++
                }
            }
            if ((card.status / cardTask) * 100 === 100) {
                card.data = new Date().toLocaleString()
                eventBus.$emit('addColumnThird', card)
            }

        },
    }

})
Vue.component('Columns3', {
    template: `
       <div class="Column">
            <div class="column_div" v-for="card in columnThird"><h2>{{card.name}}</h2>
                <span>
                    <li v-for="task in card.arrTask" v-if="task.title != null" >
                            <strong>{{task.id}}</strong>
                            <input type="checkbox" 
                            :disabled="task.completed" 
                            >
                            <span :class="{done: task.completed}" >{{task.title}}</span>
                    </li>
                    <p>Дата окончания: <br>{{card.data}}</p>
                    
                </span>
            </div>
       </div>`,
    props: {
        columnThird:{
            type: Array,

        }

    },
    methods: {}

})

Vue.component('create_card', {
    template: `
    <form @submit.prevent="createCard">
    <div class="form_create">
         <label for="name">Добавить заметку:</label>
        <input class="form_input" id="task" v-model="name" required placeholder="task"/>
        <hr>
         <div>
             <label for="name">Добавить задачу:</label>
             <input class="form_input" id="task1" v-model="name1" required placeholder="task"/>
         </div>
         <div class="form_div">
             <label for="name">Добавить задачу:</label>
             <input  class="form_input" id="task2" v-model="name2" required placeholder="task"/>
         </div>
         <div class="form_div">
             <label for="name">Добавить задачу:</label>
             <input class="form_input" id="task3" v-model="name3" required placeholder="task"/>
         </div>
         <div class="form_div">
             <label for="name">Добавить задачу:</label>
             <input class="form_input" id="task4" v-model="name4" placeholder="task">
         </div>
         <div class="form_div">
             <label for="name">Добавить задачу:</label>
             <input class="form_input" id="task5" v-model="name5" placeholder="task">
         </div>
<!--        <input @click="createCard" class="ford_submit" type="button" value="Добавить">-->
        <button class="ford_submit">Добавить</button>
     </div>
       </form>
`,
    data() {
        return {
            name: null,
            name1:null,
            name2:null,
            name3:null,
            name4:null,
            name5:null,
            errors: [],

        }
    },

    methods: {
        createCard() {
            let card = {
                name: this.name,
                arrTask: [ {id: 1, title: this.name1, completed: false},
                    {id: 2, title: this.name2, completed: false},
                    {id: 3, title: this.name3, completed: false},
                    {id: 4, title: this.name4, completed: false},
                    {id: 5, title: this.name5, completed: false},
                ],
                data: null,
                status: 0,
                errors: [],
            }
            eventBus.$emit('card-submitted', card)
            this.name = null
            this.arrTask = null
            this.name1 = null
            this.name2 = null
            this.name3 = null
            this.name4 = null
            this.name5 = null
        },
    },

    props: {
        columnFirst:{
            type: Array,
            required: false,

        },
    },
})

let app = new Vue({
    el: '#app',
    data: {

    },
})