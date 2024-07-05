# Dokumentation

## Brawler

Derzeit wird immer ein dummy "Brawler" Gameobject als gegnerischer Brawler gespawnt. Um mehr Brawler zu spawnen, mehr Spawnpoint objekte in das Level hinzufügen (an der selben stelle in der Hierarchie). Beim letzten in der Liste wird der Spielerbrawler gespawnt.

Welcher Brawler für den Spieler gespawnt wird, hängt davon ab, auf welchen Button man im `#selection-overlay` in der HTML klickt. Diese haben ein `data-brawler` attribut das angibt, welcher Brawler (Name des Graphens in FUDGE) geladen werden soll.

Damit ein Brawler richtig geladen werden kann, muss der Brawler Graph wie folgt aufgebaut sein:

```
Brawler
| - ComponentTransform
| - ComponentRigidbody (typeBody: dynamic)
| - ComponentBrawler (bzw. Brawlerspezifisch, z.B. Cowboy)
| - ComponentMainAttack (bzw Brawlerspezifisch, z.B. CowboyMainAttack)
| - ComponentSpecialAttack (bzw Brawlerspezifisch, z.B. CowboySpecialAttack)
|
└ wrapper (node so i can rotate the visuals properly)
    | - Component Transform
    |
    └ GLTF Importet Scene
```

+z ist vorwärts.

## Angriffe

Die Angriffe der Brawler müssen lediglich auf den Brawlerknoten als Component hinzugefügt werden, dann sucht sich die `ComponentBrawler` die richtigen Komponenten heraus. Ein Error wird in der Konsole ausgegeben, wenn ein Brawler nicht je eine `ComponentMainAttack` (oder eine Subklasse) und eine `ComponentSpecialAttack` (oder eine Subklasse) angehängt hat.

Es gibt bereits eine `ComponentProjectileMainAttack` Komponente welche als Hauptangriff ein Projektil verschießt. Welches Projektil verschossen werden soll kann wiederum als string (Name des Graphs) in der Komponente verändert werden. Die `CowboyMainAttack` zum Beispiel verwendet derzeit ausschließlich diese Klasse.

Viele Eigenschaften von Angriffen haben noch keine Auswirkung wie Cooldowns, Aufladungen, Delays, etc.

## Projektile

Um ein Projektil zu erstellen, muss folgende Hierarchie eingehalten sein:

```
Projectile
| - ComponentProjectile
| - ComponentTransform
| - ComponentRigidbody (typeBody: dynamic)
| - IgnoredByProjectiles
└ wrapper
    └ GLTF Importet Scene
```

Es ist egal, welche _Form_ der Collider des Rigidbodies hat, nehmt ab besten das was jeweils zum Objekt am besten passt. Es ist nur wichtig, dass der body type auf `dynamisch` gesetzt ist.

Die `IgnoredByProjectiles` Komponente sorgt dafür, dass Projektile nicht mit dem Rigidbody dieses Knotens kollidieren können.

Die Eigenschaften des Projektils (`rotateInDirection`, `damage`, `speed`, `range`) werden vom Angriff überschrieben, sollten also dort gesetzt werden, nicht im Projektil selbst.

+z ist vorwärts.

## Sonstiges

Um die sichtbaren Hitboxen auszuschalten, diese Zeile in Main.ts auskommentieren: 
```ts
viewport.physicsDebugMode = ƒ.PHYSICS_DEBUGMODE.COLLIDERS;
```