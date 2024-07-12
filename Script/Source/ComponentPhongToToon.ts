namespace Script {
  import ƒ = FudgeCore;

  export class CustomMaterial extends ƒ.Material {}

  export class ComponentPhongToToon extends ƒ.Component {
    public static readonly iSubclass: number = ƒ.Component.registerSubclass(ComponentPhongToToon);

    private static materials: { [id: string]: ƒ.Material } = {};

    constructor() {
      super();
      this.addEventListener(ƒ.EVENT.NODE_DESERIALIZED, this.hndEvent);
    }
    
    public hndEvent = (_event: Event): void => {
      switch (_event.type) {
        case ƒ.EVENT.NODE_DESERIALIZED:
          for (const node of this.node) {
            let cmpMaterial: ƒ.ComponentMaterial = node.getComponent(ƒ.ComponentMaterial);
            if (!cmpMaterial || !cmpMaterial.material)
              continue;

            cmpMaterial.material = this.materialToToon(cmpMaterial.material);
          }

          break;
      }
    }

    private materialToToon(_material: ƒ.Material): ƒ.Material {
      if (!_material.getShader().name.includes("Phong"))
        return _material;

      if (ComponentPhongToToon.materials[_material.idResource])
        return ComponentPhongToToon.materials[_material.idResource];

      let material: ƒ.Material;

      let coatClassName: string = _material.coat.type
        .replace("Normals", "")
        .replace("Remissive", "Toon");
      let coatClass: typeof ƒ.CoatToonTextured = (<ƒ.General>FudgeCore)[coatClassName];
      let coat: ƒ.CoatToonTextured = new coatClass();
      this.coatToToon(<ƒ.CoatToonTextured>_material.coat, coat);

      let shaderClassName: string = _material.getShader().name
        .replace("Normals", "")
        .replace("Phong", "Toon");
      let shaderClass: typeof ƒ.Shader = (<ƒ.General>FudgeCore)[shaderClassName];

      material = new ƒ.Material("Toon", shaderClass, coat);
      material.alphaClip = _material.alphaClip;
      ƒ.Project.deregister(material);

      material.idResource = _material.idResource;
      ComponentPhongToToon.materials[_material.idResource] = material;

      return material;
    }

    private coatToToon(_coatRemissive: ƒ.CoatRemissiveTextured, _coatToon: ƒ.CoatToonTextured): void {
      _coatToon.color = _coatRemissive.color;
      _coatToon.diffuse = _coatRemissive.diffuse;
      _coatToon.specular = _coatRemissive.specular;
      _coatToon.intensity = _coatRemissive.intensity;
      _coatToon.metallic = _coatRemissive.metallic;
      _coatToon.texture = _coatRemissive.texture;
    }
  }
}