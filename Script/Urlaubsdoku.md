# Dokumentation

## Brawler

Derzeit wird immer ein dummy "Brawler" Gameobject als gegnerischer Brawler gespawnt. Um mehr Brawler zu spawnen, mehr Spawnpoint objekte in das Level hinzufügen (an der selben stelle in der Hierarchie). Beim letzten in der Liste wird der Spielerbrawler gespawnt.

Welcher Brawler für den Spieler gespawnt wird, hängt davon ab, auf welchen Button man im `#selection-overlay` in der HTML klickt. Diese haben ein `data-brawler` attribut das angibt, welcher Brawler (Name des Graphens in FUDGE) geladen werden soll.

Damit ein Brawler richtig geladen werden kann, muss der Brawler Graph wie folgt aufgebaut sein:

```
Brawler
| - ComponentTransform
| - ComponentRigidbody (typeBody: dynamic, effectGravity: 0)
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

Alle Angriffe haben ein "Energielevel" welches erreicht werden muss, damit dieser Angriff ausgeführt werden kann. Angriffe können automatisch pro Sekunde Energie generieren um sich aufzuladen und/oder mit Energie von außen versorgt werden (kommt noch).

Die Angriffe der Brawler müssen lediglich auf den Brawlerknoten als Component hinzugefügt werden, dann sucht sich die `ComponentBrawler` die richtigen Komponenten heraus. Ein Error wird in der Konsole ausgegeben, wenn ein Brawler nicht zwei `ComponentAttack` (oder eine Subklasse) hat von denen je eine `attackType = MAIN` und eine `attackType = SPECIAL` hat.

Es gibt bereits eine `ComponentProjectileAttack` Komponente welche als Angriff ein Projektil verschießt. Welches Projektil verschossen werden soll kann wiederum als string (Name des Graphs) in der Komponente verändert werden. Die `CowboyMainAttack` zum Beispiel verwendet derzeit ausschließlich diese Klasse.

Einige Eigenschaften von Angriffen haben eventuell noch keine Auswirkung.

### Vorschau
Angriffe haben drei Möglichkeiten für eine Vorschau: `LINE` (gerade Linie), `CONE` (Dreieck) und `AREA` (Kreis).

Die Parameter sind:  
_previewWidth_ sorgt bei LINE und CONE für die (End-)Breite, während es bei AREA der Durchmesser ist.  
_range_ ist bei LINE und CONE die Länge der Vorschau, bei AREA ist es der maximale Abstand des Mittelpunktes des Kreises.

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

Damit ein Projektil ein AOE spawnt, muss der Name des AOE Graphen in das Projektil (nicht in den Angriff) eingetragen werden. _Ein Projektil mit AOE fügt seinen Schaden trotzdem beim Aufprallen zu! Wenn der Schaden also nur durch die Explosion / das AOE passieren soll, muss der Projektilschaden auf 0 gesetzt werden!_

> [!INFO]  
> wenn die Gravitation für ein Projektil eingeschaltet ist, dann gibt `speed` nicht die Geschwindigkeit sondern die Zeit bis zur Landung des Projektils an.

+z ist vorwärts.

## Area of Effects

Um ein AOE zu erstellen, muss folgende Hierarchie eingehalten sein:
```
AOE
| - ComponentAOE
| - ComponentTransform
| - ComponentRigidbody (typeBody: kinematic)
| - IgnoredByProjectiles
```

Die Größe der Transform wird beim Erstellen um den `radius` Wert der `ComponentAOE` skaliert. Also am besten nur eines von beidem verändern!

AOEs werden immer auf Höhe 0 (Bodenhöhe) gespawnt.

Die (runde) Vorschau wird automatisch eingefügt.

`duration` ist in Sekunden angegeben während die beiden `delay`s in Millisekunden angegeben werden.

> [!IMPORTANT]  
> Im Gegensatz zu den Projektilen werden die Werte der AOEs nicht von den Angriffen überschrieben!

## Sonstiges

Um die sichtbaren Hitboxen auszuschalten, diese Zeile in Main.ts auskommentieren: 
```ts
viewport.physicsDebugMode = ƒ.PHYSICS_DEBUGMODE.COLLIDERS;
```