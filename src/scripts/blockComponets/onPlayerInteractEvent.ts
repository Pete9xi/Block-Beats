import { BlockComponentPlayerInteractEvent, ItemStack, world } from "@minecraft/server";
import { ModalFormData, ModalFormResponse } from "@minecraft/server-ui";
import { debugEnabled } from "../debug/debug";
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
        const testforDynamicProp = world.getDynamicProperty("bb" + blockLocationAsString)
        if (testforDynamicProp === undefined) {
            // Dynamic property doesn't exist so lets get the block setup and show the player a UI
            const configUI = new ModalFormData();
            configUI.title("§9Block Beats - Block Config");
            configUI.textField("FileName", "");
            configUI.textField("Track Length", "");
			configUI.toggle("Loop?", false);
            configUI.slider("Pitch", 0.1, 2.0, 0.1, 1.0);
            configUI.slider("Volume", 0.01, 1.0, 0.01, 1.0);
            configUI
            .show(player)
            .then((formData: ModalFormResponse) => {
              const fileName = formData.formValues[0];
              const trackLength = formData.formValues[1];
              const isLooping = formData.formValues[2];
              const pitch = formData.formValues[3];
              const volume = formData.formValues[4];
              if(isLooping === true){
                world.setDynamicProperty("bbLength" + blockLocationAsString, trackLength.toString());
                world.setDynamicProperty("bbPitch" + blockLocationAsString, pitch);
                world.setDynamicProperty("bbVolume" + blockLocationAsString, volume);
              }
              world.setDynamicProperty("bb" + blockLocationAsString, fileName.toString());
              if(debugEnabled){
                console.log("Block Beats [DEBUG]: fileName: " + fileName);
                console.log("Block Beats [DEBUG]: trackLength: " + trackLength);
                console.log("Block Beats [DEBUG]: pitch: " + pitch);
                console.log("Block Beats [DEBUG]: volume: " + volume);
            }
            })
            .catch((error: Error) => {
              console.log("Failed to show form: " + error);
              return -1;
            });
        } else{
            const testforLockDynamicProp = world.getDynamicProperty("bbLock" + blockLocationAsString);
            //Check to see if the player is holding a stick if so we can then lock the block so it can be activated by hand.
            if(mainHandItem.typeId =="minecraft:stick"){
                if(testforLockDynamicProp === undefined){
                    //we need to create it, this means the block should not be locked, lets lock it
                    world.setDynamicProperty("bbLock" + blockLocationAsString,"locked");
                    return;
                }else{
                    //The block should be locked so lets unlock it!
                    world.setDynamicProperty("bbLock" + blockLocationAsString, undefined);
                    player.sendMessage(`§9Block Beats:§r This block has been unlocked. `);
                    return;
                }

            }
            //Lets allow the player to activate the block by hand but for the time being we will advise on it being locked.
            
            if(testforLockDynamicProp === "locked"){
                player.sendMessage(`§9Block Beats:§r This block is currently locked. `);
                return;
            }
            //Lets allow the player to edit the current set data.
            const configUI = new ModalFormData();
			const trackLengthProp = world.getDynamicProperty("bbLength" + blockLocationAsString);
            const pitchProp = world.getDynamicProperty("bbPitch" + blockLocationAsString);
            const volProp = world.getDynamicProperty("bbPitch" + blockLocationAsString);
			let currentLoopingValue = true;
			if(trackLengthProp === undefined){
			currentLoopingValue = false;
			}
            configUI.title("§9Block Beats - Block Config");
            configUI.textField("FileName", testforDynamicProp.toString());
			configUI.textField("Track Lenght", trackLengthProp.toString());
			configUI.toggle("Loop?", currentLoopingValue);
            configUI.slider("Pitch",0.1, 2.0, 0.1, Number(pitchProp));
            configUI.slider("Volume", 0.01, 1.0, 0.01, Number(volProp));
            configUI
                .show(player)
                .then((formData) => {
                const fileName = formData.formValues[0];
                const trackLength = formData.formValues[1];
                const isLooping = formData.formValues[2];
                const pitch = formData.formValues[3];
                const volume = formData.formValues[4];

                if (isLooping === true) {
                    world.setDynamicProperty("bbLength" + blockLocationAsString, trackLength.toString());
                }
                
                world.setDynamicProperty("bb" + blockLocationAsString, fileName.toString());
                world.setDynamicProperty("bbPitch" + blockLocationAsString, pitch);
                world.setDynamicProperty("bbVolume" + blockLocationAsString, volume);
                if(debugEnabled){
                    console.log("Block Beats [DEBUG]: fileName: " + fileName);
                    console.log("Block Beats [DEBUG]: trackLength: " + trackLength);
                    console.log("Block Beats [DEBUG]: pitch: " + pitch);
                    console.log("Block Beats [DEBUG]: volume: " + volume);
                }
            
            })
                .catch((error) => {
                console.log("Failed to show form: " + error);
                return -1;
            });
        }
    }    
}

