import { BlockComponentPlayerInteractEvent, ItemStack, world } from "@minecraft/server";
import { ModalFormData, ModalFormResponse } from "@minecraft/server-ui";
export class recordBox {
    constructor() {
        this.onPlayerInteract = this.onPlayerInteract.bind(this);
    }
    onPlayerInteract(e: BlockComponentPlayerInteractEvent) {
        const { player } = e;
        //@ts-ignore seems to be an issue with the types EntityEquippableComponent
        const playerequipComp: EntityEquippableComponent = player.getComponent("minecraft:equippable");
        const mainHandItem: ItemStack = playerequipComp.getEquipment("Mainhand")
        

        const blockLocationAsString = e.block.x.toString() + e.block.y.toString() + e.block.z.toString()
        //use the blocks location as a key.
        const testforDynamicProp = world.getDynamicProperty("cab" + blockLocationAsString)
        if (testforDynamicProp === undefined) {
            // Dynamic property doesn't exist so lets get the block setup and show the player a UI
            const configUI = new ModalFormData();
            configUI.title("§9Block Beats - Block Config");
            configUI.textField("FileName", "");
            configUI.textField("Track Length", "");
			configUI.toggle("Loop?", false);
            configUI
            .show(player)
            .then((formData: ModalFormResponse) => {
              const fileName = formData.formValues[0];
              const trackLength = formData.formValues[1];
              const isLooping = formData.formValues[2];
              if(isLooping === true){
                world.setDynamicProperty("cabLength" + blockLocationAsString, trackLength.toString());
              }
              world.setDynamicProperty("cab" + blockLocationAsString, fileName.toString());
            })
            .catch((error: Error) => {
              console.log("Failed to show form: " + error);
              return -1;
            });
        } else{
            const testforLockDynamicProp = world.getDynamicProperty("cabLock" + blockLocationAsString);
            //Check to see if the player is holding a stick if so we can then lock the block so it can be activated by hand.
            if(mainHandItem.typeId =="minecraft:stick"){
                if(testforLockDynamicProp === undefined){
                    //we need to create it, this means the block should not be locked, lets lock it
                    world.setDynamicProperty("cabLock" + blockLocationAsString,"locked");
                    return;
                }else{
                    //The block should be locked so lets unlock it!
                    world.setDynamicProperty("cabLock" + blockLocationAsString, undefined);
                }

            }
            //Lets allow the player to activate the block by hand but for the time being we will advise on it being locked.
            
            if(testforLockDynamicProp === "locked"){
                player.sendMessage(`§9Block Beats:§r This Block is Currently Locked. `);
                return;
            }
            //Lets allow the player to edit the current set data.
            const configUI = new ModalFormData();
			const trackLengthProp = world.getDynamicProperty("cabLength" + blockLocationAsString);
			let currentLoopingValue = true;
			if(trackLengthProp === undefined){
			currentLoopingValue = false;
			}
            configUI.title("§9Block Beats - Block Config");
            configUI.textField("FileName", testforDynamicProp.toString());
			configUI.textField("Track Lenght", trackLengthProp.toString());
			configUI.toggle("Loop?", currentLoopingValue); 
            configUI
                .show(player)
                .then((formData) => {
                const fileName = formData.formValues[0];
                const trackLength = formData.formValues[1];
                const isLooping = formData.formValues[2];
                if (isLooping === true) {
                    world.setDynamicProperty("cabLength" + blockLocationAsString, trackLength.toString());
                }
                world.setDynamicProperty("cab" + blockLocationAsString, fileName.toString());
            })
                .catch((error) => {
                console.log("Failed to show form: " + error);
                return -1;
            });
        }
    }    
}

